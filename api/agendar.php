<?php
/**
 * Recebe o formulário "Agende uma Visita" e grava no MySQL.
 * Segurança: somente POST, validação no servidor, PDO com prepared statements,
 * lista de origens permitidas (CORS), honeypot anti-robô, limite de envios por IP,
 * IP guardado só como hash e erros internos nunca expostos ao visitante.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

date_default_timezone_set('America/Sao_Paulo');

function responder(int $codigo, bool $sucesso, string $mensagem): void
{
    http_response_code($codigo);
    echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- Configuração ---------- */
$arquivoConfig = __DIR__ . '/config.local.php';
if (!is_file($arquivoConfig)) {
    error_log('[agendar] config.local.php não encontrado.');
    responder(500, false, 'Serviço temporariamente indisponível. Tente novamente mais tarde.');
}
$config = require $arquivoConfig;

/* ---------- CORS / origem ---------- */
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '') {
    if (!in_array($origem, $config['origens_permitidas'], true)) {
        responder(403, false, 'Origem não permitida.');
    }
    header('Access-Control-Allow-Origin: ' . $origem);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 600');
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($metodo !== 'POST') {
    header('Allow: POST, OPTIONS');
    responder(405, false, 'Método não permitido.');
}

// Corpo grande demais = abuso (o formulário real tem poucos KB)
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    responder(413, false, 'Dados excessivos.');
}

/* ---------- Honeypot (campo invisível que só robôs preenchem) ---------- */
if (!empty($_POST['website'])) {
    // Finge sucesso para o robô não "aprender", mas não grava nada
    responder(200, true, 'Solicitação enviada com sucesso!');
}

/* ---------- Funções de limpeza ---------- */
function texto(string $chave, bool $multilinha = false): string
{
    $valor = $_POST[$chave] ?? '';
    if (!is_string($valor)) {
        return '';
    }
    $valor = trim($valor);
    $padrao = $multilinha ? '/[^\P{C}\n]+/u' : '/\p{C}+/u'; // remove caracteres de controle
    $limpo = preg_replace($padrao, '', $valor);
    return $limpo === null ? '' : $limpo;
}

/* ---------- Coleta ---------- */
$nome     = texto('nome_responsavel');
$telefone = preg_replace('/\D+/', '', texto('telefone')) ?? '';
$email    = texto('email');
$segmento = texto('segmento');
$data     = texto('data_visita');
$horario  = texto('periodo');
$mensagem = texto('mensagem', true);

/* ---------- Validação ---------- */
$segmentosValidos = ['fundamental-2', 'medio-regular', 'medio-adm', 'medio-ads'];
$horariosValidos  = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

$tamNome = mb_strlen($nome, 'UTF-8');
if ($tamNome < 3 || $tamNome > 120 || !preg_match('/^[\p{L}\p{M}\' .\-]+$/u', $nome)) {
    responder(422, false, 'Informe seu nome completo (somente letras).');
}

if (!preg_match('/^[1-9][1-9](9\d{8}|\d{8})$/', $telefone)) {
    responder(422, false, 'Informe um telefone válido com DDD.');
}

if (mb_strlen($email, 'UTF-8') > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(422, false, 'Informe um e-mail válido.');
}

if (!in_array($segmento, $segmentosValidos, true)) {
    responder(422, false, 'Selecione o nível de ensino de interesse.');
}

$dataObj = DateTimeImmutable::createFromFormat('!Y-m-d', $data);
$erros   = DateTimeImmutable::getLastErrors();
if (
    $dataObj === false
    || ($erros !== false && ($erros['warning_count'] > 0 || $erros['error_count'] > 0))
    || $dataObj->format('Y-m-d') !== $data
) {
    responder(422, false, 'Escolha uma data válida.');
}

$hoje = new DateTimeImmutable('today');
if ($dataObj < $hoje) {
    responder(422, false, 'Escolha uma data a partir de hoje.');
}
if ($dataObj > $hoje->modify('+180 days')) {
    responder(422, false, 'Escolha uma data dentro dos próximos 6 meses.');
}

if (!in_array($horario, $horariosValidos, true)) {
    responder(422, false, 'Selecione um horário válido.');
}
if ($data === $hoje->format('Y-m-d') && (int) substr($horario, 0, 2) <= (int) date('G')) {
    responder(422, false, 'Esse horário já passou. Escolha outro.');
}

if (mb_strlen($mensagem, 'UTF-8') > 1000) {
    responder(422, false, 'A mensagem pode ter no máximo 1000 caracteres.');
}

/* ---------- IP (apenas como hash) ---------- */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!empty($config['confiar_proxy_cloudflare']) && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
}
$ipHash = hash_hmac('sha256', $ip, (string) $config['sal_ip']);

/* ---------- Banco de dados ---------- */
try {
    $pdo = new PDO(
        'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_nome'] . ';charset=utf8mb4',
        $config['db_usuario'],
        $config['db_senha'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    // Limite de envios por IP na última hora
    $consulta = $pdo->prepare(
        'SELECT COUNT(*) FROM agendamentos WHERE ip_hash = :ip AND criado_em > (NOW() - INTERVAL 1 HOUR)'
    );
    $consulta->execute([':ip' => $ipHash]);
    if ((int) $consulta->fetchColumn() >= (int) $config['limite_por_hora']) {
        responder(429, false, 'Muitas solicitações em pouco tempo. Tente novamente mais tarde.');
    }

    // Evita duplicar o mesmo pedido (duplo clique, reenvio)
    $duplicado = $pdo->prepare(
        'SELECT id FROM agendamentos
          WHERE email = :email AND data_visita = :data AND horario = :horario
          LIMIT 1'
    );
    $duplicado->execute([':email' => $email, ':data' => $data, ':horario' => $horario . ':00']);
    if ($duplicado->fetch()) {
        responder(200, true, 'Solicitação enviada com sucesso!');
    }

    $inserir = $pdo->prepare(
        'INSERT INTO agendamentos (nome, telefone, email, segmento, data_visita, horario, mensagem, ip_hash)
         VALUES (:nome, :telefone, :email, :segmento, :data, :horario, :mensagem, :ip)'
    );
    $inserir->execute([
        ':nome'     => $nome,
        ':telefone' => $telefone,
        ':email'    => $email,
        ':segmento' => $segmento,
        ':data'     => $data,
        ':horario'  => $horario . ':00',
        ':mensagem' => $mensagem !== '' ? $mensagem : null,
        ':ip'       => $ipHash,
    ]);
} catch (PDOException $e) {
    // Detalhes ficam só no log do servidor, nunca vão para o visitante
    error_log('[agendar] Erro de banco: ' . $e->getMessage());
    responder(500, false, 'Não foi possível registrar sua solicitação agora. Tente novamente mais tarde.');
}

responder(200, true, 'Solicitação enviada com sucesso!');
