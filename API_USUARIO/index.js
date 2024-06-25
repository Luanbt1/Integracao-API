const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
const authRoutes = require('./routes/auth'); // Certifique-se de que o caminho está correto

app.use(express.json());

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/Usuarios', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

app.use('/auth', authRoutes);

app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
});
