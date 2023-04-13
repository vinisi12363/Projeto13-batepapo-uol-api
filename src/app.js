import express from 'express'
import Cors from 'cors'
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';

dayjs.locale('pt-br')
dotenv.config();

import Joi from 'joi'

const nameSchema = Joi.string().min(3).max(30).alphanum().required();



const api = express()
api.use(Cors())
api.use(express.json())
const port = 5000

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;


mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

api.get("/participants", (req, res) => {
    // buscando usuários
    db.collection("participants").find().toArray()
        .then(users => res.send(users))  // array de usuários
        .catch(err => res.status(500).send(err.message))  // mensagem de erro
});

async function validateFieldName(name) {
    try {
      const nameValidated = await nameSchema.validateAsync(name);
      return {
        name: nameValidated,
      };
    } catch (error) {
     console.log(error)

    }
  }

api.post("/participants", (req, res) => {
    
 
    const { name } = req.body
    if (typeof name != 'string') 
        return res.status(422).json({ error: "o campo em formato invalido" })
    if (!name)
        return res.status(422).json({ error: "o campo de usuario é obrigatorio" })

    const userNameValid = validateFieldName(name)


    if (userNameValid){
        db.collection("participants").findOne({ name: name })
        .then(users => {
            if (users)
                return res.status(409).json({ message: "o Nome de usuário já está sendo usado" })
            else {
                db.collection("participants").insertOne({
                    name: name,
                    lastStatus: Date.now()
                }).then(users => {
                   
                    db.collection("messages").insertOne({
                        from: name,
                        to: "Todos",
                        text: "entra na sala...",
                        type: "status",
                        time: dayjs().format('HH:mm:ss')
                    }).then(mess => res.sendStatus(201))
                        .catch(err => res.status(500).send(err.message))


                })
                    .catch(err => res.status(500).send(err.message))
            }

        })
        .catch(err => res.status(500).send(err.message))
    }else{
        return res.status(422).json({ error: "campo inválido" })
    }
   
});



api.get("/messages", (req, res) => {

    
    db.collection("messages").find().toArray()
        .then(data => res.send(data))  
        .catch(err => res.status(500).send(err.message)) 
});


api.post("/messages", (req, res) => {
    const user = req.headers.user; 
   
    console.log("REQ HEADERS", req.headers)
    const {to , text , type} = req.body
    console.log("TYPE", type)
     
    if (!to || !text || !type)
        return res.status(422).json({ error: "o campo é obrigatorio" })

    if(type !== "message" && type !== "private_message")
        return res.status(422).json({ error: "campo inválido" })
   
    if (!user)
        return res.status(422).json({ error: "o campo de nome de usuario é obrigatorio" })
   



    if (user && user !== null){
        db.collection("participants").findOne({name:user})
        .then(data =>{
            db.collection("messages").insertOne({
                from: user,
                to: to,
                text: text,
                type: type,
                time: dayjs().format('HH:mm:ss')
            }).then(users => res.sendStatus(201),  /*res.send(posts)*/)
                .catch(err => res.status(500).send(err.message))
        })
        .catch(err => res.status(422).json({ error: "o campo de nome de usuario é obrigatorio" }))

    }
   
});


api.listen(port, () => console.log(`Servidor iniciado na porta ${port}`))