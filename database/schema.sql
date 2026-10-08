-- Banco de dados do "Agende sua Visita" - Colégio Estadual Mendes Gonçalves
-- Importe este arquivo no phpMyAdmin (aba "Importar") dentro do banco criado na hospedagem.
-- NÃO envie a pasta "database" para o servidor público.

CREATE TABLE IF NOT EXISTS agendamentos (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(120) NOT NULL,
    telefone    VARCHAR(11)  NOT NULL,              -- somente dígitos (DDD + número)
    email       VARCHAR(150) NOT NULL,
    segmento    VARCHAR(30)  NOT NULL,
    data_visita DATE         NOT NULL,
    horario     TIME         NOT NULL,
    mensagem    TEXT         NULL,
    status      ENUM('pendente','confirmado','cancelado','realizado') NOT NULL DEFAULT 'pendente',
    ip_hash     CHAR(64)     NOT NULL,              -- hash do IP (não guarda o IP real) usado no limite de envios
    criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_data_horario (data_visita, horario),
    KEY idx_ip_criado    (ip_hash, criado_em),
    KEY idx_status       (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RECOMENDADO: crie um usuário exclusivo para o site, só com as permissões necessárias.
-- (Troque o nome do banco, o usuário e a senha.)
--
-- CREATE USER 'site_visitas'@'localhost' IDENTIFIED BY 'COLOQUE_UMA_SENHA_FORTE_AQUI';
-- GRANT SELECT, INSERT ON NOME_DO_BANCO.agendamentos TO 'site_visitas'@'localhost';
-- FLUSH PRIVILEGES;
