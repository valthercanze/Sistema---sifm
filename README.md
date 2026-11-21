# SIIFM - Sistema Integrado de Inclusão Financeira Municipal

![Status](https://img.shields.io/badge/Status-Conclu%C3%ADdo-success)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-lightgrey)

## 📖 Sobre o Projeto
O **SIIFM** é uma aplicação web completa (SPA + API RESTful) que desenvolvi para modernizar a arrecadação de taxas municipais. O sistema permite o pagamento de taxas via carteiras móveis (M-Pesa, e-Mola), numerário e POS, além de fornecer relatórios em tempo real, auditoria completa e gestão de utilizadores.

O grande diferencial deste projeto é a sua arquitetura multicanal com separação de acessos por perfil na mesma porta, garantindo segurança, integridade financeira (sem eliminação destrutiva de taxas) e uma experiência de utilização fluida tanto para o cidadão como para os funcionários do município.

## Principais Funcionalidades
-  **Múltiplos Portais**: Acesso isolado por rotas (`/login`, `/admin/login`, `/gestor/login`) com injeção de dependências por perfil.
-  **Pagamentos Flexíveis**: Integração com M-Pesa, e-Mola, POS e dinheiro (numerário).
- **Validação de Rede**: Lógica de negócio que impede pagar via M-Pesa com números Movitel (e vice-versa).
- **Recibos Digitais**: Emissão automática de recibo com código único após confirmação.
- **Segurança Financeira**: O sistema não permite apagar taxas com histórico de pagamentos (Soft Delete), protegendo a integridade dos dados.
-  **Relatórios e Dashboards**: Painel administrativo com exportação de dados para Excel (CSV) e PDF.
- **Auditoria**: Registo cronológico de todas as ações críticas (Logins, pagamentos, criação de taxas).
-  **Notificações**: Envio de SMS e E-mail (simulados no ambiente de teste).

## Tecnologias Utilizadas
| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React.js (Vite), React Router, CSS Puro |
| **Backend** | Node.js, Express.js |
| **Base de Dados** | SQLite (via `better-sqlite3`) |
| **Segurança** | JWT (Tokens), Bcrypt (Hash de passwords) |

##  Como executar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)

1.Configurar e Ligar o Backend
Abre o primeiro terminal e executa:

cd backend
npm install
# Criar o ficheiro de variáveis de ambiente
cp .env.example .env 

# Preparar a base de dados (cria o Admin e taxas iniciais)
npm run seed 

# Ligar o servidor
npm run dev

Configurar e Ligar o Frontend
Abre um novo terminal (mantém o do backend aberto) e executa:

cd frontend
npm install
npm run dev

 Links de Acesso (Ambiente Local)
O sistema está configurado para correr tudo na mesma porta (5173), separando o acesso pelas rotas:

Portal do Cidadão: http://localhost:5173/login

Portal do Administrador: http://localhost:5173/admin/login

Portal do Gestor (Balcão): http://localhost:5173/gestor/login

Credenciais (Ambiente de Teste)
Para aceder ao Portal do Administrador, usa:

Telefone: 840000000

Senha: admin123

(Para o cidadão, basta clicar em "Registar" no portal do contribuinte).

Desenvolvedor
valther antonio canze

