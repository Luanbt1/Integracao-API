const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).send('User already exists');
        }

        let userEmail = await User.findOne({ email });
        if (userEmail) {
            return res.status(400).send('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ username, password: hashedPassword, email });
        await user.save();

        res.status(201).send('User registered');
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ username: user.username }, 'secretkey', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// Função para listar todos os usuários
exports.listUsers = async (req, res) => {
    try {
        const users = await User.find().select('username email -_id'); // Seleciona os campos username e email
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// Função para atualizar um usuário
exports.updateUser = async (req, res) => {
    const { username } = req.params;
    const { newPassword, newEmail } = req.body;

    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        if (newEmail) {
            let userEmail = await User.findOne({ email: newEmail });
            if (userEmail) {
                return res.status(400).send('Email already in use');
            }
            user.email = newEmail;
        }

        await user.save();
        res.send('User updated');
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// Função para deletar um usuário
exports.deleteUser = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOneAndDelete({ username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send('User deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
};
