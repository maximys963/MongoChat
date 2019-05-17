const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongoDB

 mongo.connect('mongodb://localhost:27017', (err, db) => {
     if(err){
         throw err;
     }

     console.log('MongoDB connected');

     // Connect to Socket.io

     client.on('connection', (socket) => {
         let chat = db.collection('chats');

         // Create function to send status
         const sendStatus = function(s){
             socket.emit('status', s);
         };

         chat.find().limit(100).sort({_id: 1}).toArray((err, res) => {
             if(err){
                 throw err
             }
             // Emit the messages
             socket.emit('output', res);
         });
         // Handle input events
         socket.on('input', (data) => {
             let name = data.name;
             let message = data.message;

             //Check for name and message

             if(name == '' || message == ''){
                 // Send error status
                 sendStatus('Please enter a name and message')
             }else{
                 // Insert message
                 chat.insert({name: name, message: message}, () => {
                      client.emit('output', [data]);

                      //Send status obj

                     sendStatus({
                         message: 'Message sent',
                         clear: true
                     });
                 });
             }
         });

         // Handle clear
         socket.on('clear', () => {
             //remove all chats from collection
             chat.remove({}, () => {
                 //Emit cleared
                 socket.emit('cleared')
             })
         })
     });

 });