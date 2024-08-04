const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST'],
  },
});
const prisma = new PrismaClient();

app.use(cors());

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı');

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, content } = data;

    // Odanın var olup olmadığını kontrol et

    let room = await prisma.room.findFirst({
      where: {
        users: {
          every: {
            profileId: {
              in: [senderId, receiverId],
            },
          },
        },
      },
    });

    // Oda yoksa oluştur
   
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: `room_${senderId}_${receiverId}`,
          users: {
            create: [
              { profileId: senderId },
              { profileId: receiverId },
            ],
          },
        },
      });
    }
    console.log(room.id,senderId,receiverId);
    
    // Mesajı oluştur ve kaydet
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        roomId: room.id,
      },
    });

    // Eski mesajları al
    const oldMessages = await prisma.message.findMany({
      where: {
        roomId: room.id,
      },
      include:{
        sender:{
          select:{
            user:true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Her iki kullanıcıyı da odaya ekle
    socket.join(`room_${room.id}`);
    io.to(`room_${room.id}`).emit('receive_message', oldMessages );
  });

  socket.on('join_room', async ({ senderId, receiverId }) => {
    // Odanın var olup olmadığını kontrol et
    

    const room = await prisma.room.findFirst({
      where: {
        users: {
          every: {
            profileId: {
              in: [senderId, receiverId],
            },
          },
        },
      },
    });
    
    if (room) {
      socket.join(`room_${room.id}`);
      console.log(room.id, senderId,receiverId);
      

      // Eski mesajları al
      const oldMessages = await prisma.message.findMany({
        where: {
          roomId: room.id,
        },
        include:{
          sender:{
            select:{
              user:true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      
    
      socket.emit('load_messages', oldMessages);
      
    }
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı bağlantıyı kesti');
  });
});

server.listen(5000, () => {
  console.log('Sunucu 5000 portunda çalışıyor');
});
