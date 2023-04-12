import express from 'express'
import Cors from 'cors'
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';

dayjs.locale('pt-br')
dotenv.config();

import joi from 'joi'


const schema = joi.object({
    username: joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()

})


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



api.post("/participants", (req, res) => {
    let userNameValid

    const { name } = req.body
    if (!name)
        return res.status(422).json({ error: "o campo de usuario é obrigatorio" })

    try {
        userNameValid = schema.validateAsync({ username: name })
    } catch (err) { }



    db.collection("participants").findOne({ name: name })
        .then(users => {
            if (users)
                return res.status(409).json({ message: "o Nome de usuário já está sendo usado" })
            else {
                db.collection("participants").insertOne({
                    name: name,
                    lasStatus: Date.now()
                }).then(users => {
                    let time = dayjs().format('HH:mm:ss')
                    db.collection("messages").insertOne({
                        from: name,
                        to: "Todos",
                        text: "entra na sala...",
                        type: "status",
                        time: time
                    }).then(mess => res.sendStatus(201))
                        .catch(err => res.status(500).send(err.message))


                })
                    .catch(err => res.status(500).send(err.message))
            }

        })
        .catch(err => res.status(500).send(err.message))


});



api.get("/messages", (req, res) => {
    // buscando usuários
    db.collection("messages").find({ name: "Goku" }).toArray()
        .then(users => res.send(users))  // array de usuários
        .catch(err => res.status(500).send(err.message))  // mensagem de erro
});


api.post("/messages", (req, res) => {
    // inserindo usuário
    db.collection("messages").insertOne({
        from: "Felipe",
        to: "Todos",
        text: "oi galera",
        type: "message",
        time: "20:04:47"
    }).then(users => res.sendStatus(201))
        .catch(err => res.status(500).send(err.message))
});


api.listen(port, () => console.log(`Servidor iniciado na porta ${port}`))