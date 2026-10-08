<?php
/*
 * COPIE este arquivo para "config.local.php" e preencha com os dados reais.
 * O config.local.php NUNCA deve ir para o GitHub (já está no .gitignore).
 */
return [
    'db_host'    => 'localhost',
    'db_nome'    => 'NOME_DO_BANCO',
    'db_usuario' => 'site_visitas',
    'db_senha'   => 'COLOQUE_A_SENHA_AQUI',

    // Texto aleatório e longo (use https://www.random.org/strings/ ou 40+ caracteres digitados ao acaso).
    // Serve para "embaralhar" o IP antes de guardar no banco.
    'sal_ip'     => 'TROQUE_POR_UM_TEXTO_ALEATORIO_BEM_LONGO',

    // Endereços (com https://, sem barra no final) de onde o formulário pode enviar dados.
    'origens_permitidas' => [
        'https://www.seudominio.com.br',
        'https://seudominio.com.br',
        // 'https://SEUUSUARIO.github.io',   // se o front-end continuar no GitHub Pages
    ],

    // Máximo de solicitações por IP a cada 1 hora.
    'limite_por_hora' => 3,

    // Deixe false, a menos que o site esteja atrás de um proxy/CDN (ex.: Cloudflare).
    'confiar_proxy_cloudflare' => false,
];
