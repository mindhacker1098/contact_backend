const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Connect to MongoDB
mongoose.connect('mongodb+srv://mindhacker1098:spn1098@cluster0.t66x9u5.mongodb.net/chat-app?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Define User and Message schemas
const userSchema = new mongoose.Schema({
  name: String,
  phoneNumbers: [String],
});

const messageSchema = new mongoose.Schema({
  sender: String,
  recipient: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Route to handle uploading contacts
app.post('/uploadContacts', async (req, res) => {
  try {
    const contacts = req.body.contacts;
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No contacts provided' });
    }

    await User.insertMany(contacts);
    res.status(201).json({ status: 'success', message: 'Contacts uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error uploading contacts' });
  }
});

// Socket.io setup for chat
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async (data) => {
    const { sender, recipient, message } = data;
    const newMessage = new Message({ sender, recipient, message });
    await newMessage.save();
    io.emit('receiveMessage', newMessage); // Emit to all clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
