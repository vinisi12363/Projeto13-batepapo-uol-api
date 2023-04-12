import express from 'express'
import Cors from 'cors'
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const api = express()
api.use(Cors())
api.use(express.json())
const port = 5000

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;


mongoClient.connect()
	.then(() => db = mongoClient.db())
	.catch((err) => console.log(err.message))

api.get("/usuarios", (req, res) => {
	// buscando usuários
	db.collection("participants").find().toArray()
		.then(users => res.send(users))  // array de usuários
		.catch(err => res.status(500).send(err.message))  // mensagem de erro
});

api.post("/usuarios", (req, res) => {
	// inserindo usuário
	db.collection("participants").insertOne({
		name: "Felipe",
		lasStatus: 132654565
	}).then(users => res.sendStatus(201))
		.catch(err => res.status(500).send(err.message))
});



api.get("/messages", (req, res) => {
	// buscando usuários
	db.collection("messages").find().toArray()
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