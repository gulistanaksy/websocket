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
    const { senderName, receiverName, content } = data;

    const senderProfileId= await prisma.profile.findFirst({
      where:{
        user:{
            username:senderName,
        }
      },
      select:{
        id:true,
      }
    })
    
    const receiverProfileId= await prisma.profile.findFirst({
      where:{
        user:{
            username:receiverName,
        }
      },
      select:{
        id:true,
      }
    })
    
    if( senderProfileId && receiverProfileId && senderProfileId.id && receiverProfileId.id){
      
      // Odanın var olup olmadığını kontrol et
      let room = await prisma.room.findFirst({
        where: {
          users: {
            every: {
              profileId: {
                in: [senderProfileId.id, receiverProfileId.id],
              },
            },
          },
        },
      });
  
      // Oda yoksa oluştur
     
      if (!room) {
        room = await prisma.room.create({
          data: {
            name: `room_${senderProfileId.id}_${receiverProfileId.id}`,
            users: {
              create: [
                { profileId: senderProfileId.id },
                { profileId: receiverProfileId.id },
              ],
            },
          },
        });
      }
      console.log(room.id,senderProfileId,receiverProfileId);

      // Mesajı oluştur ve kaydet
      const message = await prisma.message.create({
        data: {
          content,
          senderId:senderProfileId.id,
          receiverId:receiverProfileId.id,
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
    }
    
  });

  socket.on('join_room', async ({ senderName, receiverName }) => {
    // Odanın var olup olmadığını kontrol et
    
    const senderProfileId= await prisma.profile.findFirst({
      where:{
        user:{
            username:senderName,
        }
      },
      select:{
        id:true,
      }
    })

    const receiverProfileId= await prisma.profile.findFirst({
      where:{
        user:{
            username:receiverName,
        }
      },
      select:{
        id:true,
      }
    })
    console.log("sender:",senderProfileId,"receiver:",receiverProfileId);
    
    if( senderProfileId && receiverProfileId && senderProfileId.id && receiverProfileId.id){
      const room = await prisma.room.findFirst({
        where: {
          users: {
            every: {
              profileId: {
                in: [senderProfileId.id, receiverProfileId.id],
              },
            },
          },
        },
      });

      if (room) {
        socket.join(`room_${room.id}`);
        console.log(room.id, senderProfileId,receiverProfileId);
        
  
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
    
    }
    
});

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı bağlantıyı kesti');
  });
});

server.listen(5000, () => {
  console.log('Sunucu 5000 portunda çalışıyor');
});
