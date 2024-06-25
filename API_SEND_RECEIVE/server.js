const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');
const authMiddleware = require('./authMiddleware'); // Importar o middleware de autenticação

const app = express();
const PORT = 3001;

// Conectar ao banco de dados de mensagens
mongoose.connect('mongodb://localhost:27017/mensagens', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Conectar ao banco de dados de usuários
const userConnection = mongoose.createConnection('mongodb://localhost:27017/Usuarios', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definir o modelo de mensagem
const MensagemSchema = new mongoose.Schema({
  conteudo: String,
  enviadoPor: String,
  recebidoPor: String,
  data: { type: Date, default: Date.now },
});

const Mensagem = mongoose.model('Mensagem', MensagemSchema);

// Definir o modelo de usuário
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = userConnection.model('User', UserSchema);

app.use(bodyParser.json());
app.use(authMiddleware); // Usar o middleware de autenticação em todas as rotas

// Função para enviar mensagem para a fila RabbitMQ
function sendToQueue(message, callback) {
  amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
      return callback(error0);
    }
    connection.createChannel(function(error1, channel) {
      if (error1) {
        return callback(error1);
      }
      const queue = 'hello';
      const msg = message;
  
      channel.assertQueue(queue, {
        durable: false
      });
  
      channel.sendToQueue(queue, Buffer.from(msg));
      console.log(" [x] Sent %s", msg);

      callback(null, " [x] Sent " + msg);
    });
  });
}

// Rota POST para enviar a mensagem
app.post('/send', async (req, res) => {
  const { mensagem, recebidoPor } = req.body;
  const enviadoPor = req.user.username; // Usar o nome de usuário autenticado
  
  if (!mensagem || !enviadoPor || !recebidoPor) {
    return res.status(400).send('Todos os campos (mensagem, enviadoPor, recebidoPor) são obrigatórios');
  }

  try {
    // Verificar se o usuário de destino existe no banco de dados de usuários
    const usuarioDestino = await User.findOne({ username: recebidoPor });
    if (!usuarioDestino) {
      return res.status(404).send('Usuário de destino não encontrado');
    }

    sendToQueue(mensagem, async (err, result) => {
      if (err) {
        return res.status(500).send('Erro ao enviar mensagem: ' + err.message);
      }

      try {
        // Salvar a mensagem no MongoDB
        const novaMensagem = new Mensagem({ conteudo: mensagem, enviadoPor, recebidoPor });
        await novaMensagem.save();
        res.send(result);
      } catch (err) {
        res.status(500).send('Erro ao salvar mensagem no banco de dados: ' + err.message);
      }
    });
  } catch (err) {
    res.status(500).send('Erro ao verificar usuário de destino: ' + err.message);
  }
});

// Rota POST para buscar a mensagem no banco de dados
app.post('/search', async (req, res) => {
  const { mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).send('Mensagem não fornecida');
  }

  try {
    const result = await Mensagem.findOne({ conteudo: mensagem });
    if (!result) {
      return res.status(404).send('Mensagem não encontrada');
    }
    res.send(result);
  } catch (err) {
    res.status(500).send('Erro ao buscar mensagem no banco de dados: ' + err.message);
  }
});

// Rota POST para filtrar mensagens por remetente ou destinatário
app.post('/filter', async (req, res) => {
  const { enviadoPor, recebidoPor } = req.body;

  if (!enviadoPor && !recebidoPor) {
    return res.status(400).send('Pelo menos um dos campos (enviadoPor, recebidoPor) deve ser fornecido');
  }

  let filter = {};
  if (enviadoPor) {
    filter.enviadoPor = enviadoPor;
  }
  if (recebidoPor) {
    filter.recebidoPor = recebidoPor;
  }

  try {
    const results = await Mensagem.find(filter);
    res.send(results);
  } catch (err) {
    res.status(500).send('Erro ao filtrar mensagens no banco de dados: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
