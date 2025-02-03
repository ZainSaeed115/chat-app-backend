import User from "../models/user/user.model.js";
import { faker } from "@faker-js/faker";
import Account from "../models/user/account.model.js";
import Chat from "../models/chat/chat.model.js"
import Message from "../models/message/message.model.js";
const createUser = async (numUsers) => {
  try {
    const usersPromise = [];

    for (let i = 0; i < numUsers; i++) {
      // First, create the user and await the result
      const tempUser = await User.create({
        fName: faker.person.firstName(),
        lName: faker.person.lastName(),
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
        gender: faker.person.sex(),
        phone: faker.phone.number(),
      });

      // Then create the account with the user's _id
      const tempAccount = Account.create({
        user: tempUser._id, // Use the _id of the created user
        username: faker.internet.userName(),
        Bio: faker.lorem.sentence(10),
        password: "password", // You can use bcrypt to hash the password here
        email: faker.internet.email(),
        status: "Active",
      });

      // Push the account creation to the promise array
      usersPromise.push(tempAccount);
    }

    // Await all user and account creations in parallel
    await Promise.all(usersPromise);

    console.log(`Successfully created ${numUsers} users`);
  } catch (error) {
    console.log("Error:", error);
    process.exit(1);
  }
};

const createSingleChat=async(numChats)=>{
 try {
   const users= await Account.find().select("_id");
   const chatsPromise=[];
   for(let i=0;i<users.length;i++){
    for(let j=i+1;j<users.length;j++){
        chatsPromise.push(
         Chat.create({
          name:faker.lorem.words(2),
          members:[users[i],users[j]]
         })
        )
    }
   }
   await Promise.all(chatsPromise);
   console.log(`Successfully created ${numChats} chats`);
 } catch (error) {
  console.log(`Create single chat error: ${error}`);
 }
}
const createGroupChat=async (numChats)=>{
  try {
    const users = await Account.find().select("_id");
    const chatsPromise = [];
    for (let i = 0; i < numChats; i++) {
     const numMembers=faker.number.int({
      min:3,max:users.length
     })
     const members=[];
     for(let j=0;j<numMembers;j++){
      const randomIndex=Math.floor(Math.random()*users.length)
      const randomUsers=users[randomIndex];
      if(!members.includes(randomUsers)){
        members.push(randomUsers);
      }
     }

     const chat=await Chat.create(
      {
        groupChat:true,
        name:faker.lorem.words(2),
        members,
        creator:members[0]
      }
     )
     chatsPromise.push(chat);
    }
    await Promise.all(chatsPromise);
    console.log(`Successfully created ${numChats} group chats`);


  } catch (error) {
   console.log(`Create group chat error: ${error}`);
  }
}

const createMessage=async(numMessages)=>{
   try {
    const chats = await Chat.find().select("_id");
    const users=await Account.find().select("_id");

    const messagesPromise = [];
    for (let i = 0; i < numMessages; i++) {
      const randomChatIndex=Math.floor(Math.random()*chats.length)
      const randomChat=chats[randomChatIndex];
      const randomUserIndex=Math.floor(Math.random()*users.length)
      const randomUser=users[randomUserIndex];

      messagesPromise.push(
        Message.create({
          chat:randomChat,
          sender:randomUser,
          content:faker.lorem.sentence(),
        })
      )
    }
    await Promise.all(messagesPromise);
    console.log(`Successfully created ${numMessages} messages`);
   } catch (error) {
    console.log(`Error creating message: ${error}`);
   }
}

const createMessageInChat=async(chatId,numMessages)=>{
 try {
   const user= await Account.find().select("_id");
   const messagesPromise = [];
   for (let i = 0; i < numMessages; i++) {
    const randomUser=user[Math.floor(Math.random()*user.length)];
    messagesPromise.push(Message.create({
      chat:chatId,
      sender:randomUser,
      content:faker.lorem.sentence(),
    }))

   }
   await Promise.all(messagesPromise);
   console.log(`Successfully created ${numMessages} messages in chat ${chatId}`);
 } catch (error) {
  console.log(`Error creating message in chat: ${error}`);
 }
}
export { createUser ,createGroupChat,createSingleChat,createMessage,createMessageInChat};
