import express from 'express'
import Cors from 'cors'
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';
import joi from 'joi';
dayjs.locale('pt-br')
dotenv.config();



const nameSchema = joi.object({
    name:joi.string().required().alphanum().min(3).max(30)
})

const limitSchema = joi.number().required()


const api = express()
api.use(Cors())
api.use(express.json())
const port = 5000

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db
try{
    mongoClient.connect()
     db = mongoClient.db()
}catch(err){
    (err) => console.log(err.message)
}


api.get("/participants", async (req, res) => {
    
    try{
        const users = await db.collection("participants").find().toArray()
        res.send(users) 
    }catch(err){
        res.status(500).send(err.message)
    }
  
});

api.post("/participants",  async (req, res) => {

    const { name } = req.body

    if (!name)
        return res.status(422).json({ error: "o campo de usuario é obrigatorio" })

    const validation = nameSchema.validate({name}, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const userAlreadyExist =  await db.collection("participants").findOne({ name: name })
            
                    if (userAlreadyExist)
                        return res.status(409).json({ message: "o Nome de usuário já está sendo usado" })
                    
                    await  db.collection("participants").insertOne({
                            name: name,
                            lastStatus: Date.now()
                    })
                    
                    await db.collection("messages").insertOne({
                                from: name,
                                to: "Todos",
                                text: "entra na sala...",
                                type: "status",
                                time: dayjs().format('HH:mm:ss')
                    })

                    res.sendStatus(201).json({message:"created"})
        
        } catch (err) {
            return res.status(500).json({err})
        }

});


api.get("/messages", async (req, res) => {

    const {user} = req.headers;
    const limit = parseInt(req.query.limit);
    
    const validateUser = nameSchema.validate({user})
    if (validateUser.error){
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors); 
    }

    const validation = limitSchema.validate(limit)
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
       const commonMessages = await db.collection("messages").find({ $or: [{ to: 'Todos' }, { type: 'status' } , {type:'message'}] }).toArray()
        
       if (limit <= 0)
       return res.status(422).json({ error: "campo limit tem que ser maior que zero" })
 

       const privateMessages = await db.collection("messages").find({$or:[{ to: user }, { from: user } , {type:'private_message'}]}).limit(limit).toArray()
       
       res.send(privateMessages)
       res.send(commonMessages)

    }catch(err){
      res.status(500).send(err.message)
    }

})


api.post("/messages", (req, res) => {
    const user = req.headers.user
    const { to, text, type } = req.body


    if (!to || !text || !type)
        return res.status(422).json({ error: "o campo é obrigatorio" })

    if (type !== "message" && type !== "private_message")
        return res.status(422).json({ error: "campo inválido" })

    if (!user)
        return res.status(422).json({ error: "o campo de nome de usuario é obrigatorio" })
    db.collection("participants").findOne({name:user})
    .then()
    .catch(err => {return res.status(422).json({ error: "usuario nao cadastrado" })})

    if (user && user !== null) {
        db.collection("participants").findOne({ name: user })
            .then(data => {
                db.collection("messages").insertOne({
                    from: user,
                    to: to,
                    text: text,
                    type: type,
                    time: dayjs().format('HH:mm:ss')
                }).then(users => res.sendStatus(201),  /*res.send(posts)*/)
                    .catch(err => res.status(500).send(err.message))
            })
            .catch(err => res.status(422).json({ error: "usuario nao cadastrado" }))

    }

});

api.post ("/status", async (req, res)=>{
        const user = req.headers.user
        const d = new Date();
        let time = d.getTime();
            console.log ("date now",Date.now(), " now -10 ", Date.now()- 10000, " time " , time )
        
        
        if(!user)
        return res.status(404).json({error:"erro nao existe usuario ativo"}) 
    
        try{
            db.collection("participants").update({name:user}, {$set:{lastStatus : Date.now()}})
            res.status(200)
        }
        catch(err){
            res.status(500).send(err.message)
        }
            
        
 })
    
/**
        setInterval(()=>{
            try{
                db.collection("participants").deleteMany({ lastStatus: { $lt: tenSecondsAgo}})
                db.collection("messages").insertOne({
                    from: user,
                    to: "Todos",
                    text: "sai na sala...",
                    type: "status",
                    time: dayjs().format('HH:mm:ss')
                }).then(mess => res.status(201))
                  .catch(err => res.status(500).send(err.message))
            }
            catch(error){
                console.log("ERROR",error)
            }
        },15000)
       
     */


api.listen(port, () => console.log(`Servidor iniciado na porta ${port}`))

