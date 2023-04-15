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
const userSchema = joi.string()

const limitSchema = joi.number()

const messageSchema = joi.object({
    to:joi.string().required(),
    text:joi.string().required(),
    type:joi.string().required()
})


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
    console.log("USER:", name)

    if (!name)
        return res.status(422).json({ error: "o campo de usuario é obrigatorio" })

   

    try {
        const validation = nameSchema.validate({name}, { abortEarly: false });
        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
        }

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
            return res.status(500)
        }

});


api.get("/messages", async (req, res) => {

    const user = req.headers.user;
    console.log('USER',req.headers)
    const limit = parseInt(req.query.limit);
    
    if(!user) return res.status(422).send("campo de usuario invalido")

    if(typeof user !== "string" ) return res.status(422).send("formato de user invalido") 


    try {  
                    

        const validation = limitSchema.validate(limit)
        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
        }


       const messages = await db.collection("messages").find({ $or: [{ to: 'Todos'},{ to: user }, { from: user } , {type:'private_message'}] }).limit(limit).toArray()
      
       if (limit <= 0)
       return res.status(422).json({ error: "campo limit tem que ser maior que zero" })
 

       res.send(messages)

    }catch(err){
        res.status(500).send(err.message)
    }
  
})


api.post("/messages", async (req, res) => {
    const { user } = req.headers
    console.log('req headers: ', req.headers)
    const { to, text, type } = req.body

    const validateBody = messageSchema.validate({to, text, type},{ abortEarly: false })
    if (validateBody.error){
        const errors = validateBody.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    if (type !== "message" && type !== "private_message")
        return res.status(422).json({ error: "campo inválido" })

    const validateUser= userSchema.validate(user)
    if(validateUser.error){
        const errors = validateUser.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try{
        db.collection("messages").insertOne({
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().format('HH:mm:ss')
        })
        res.sendStatus(201)

    }catch(err){  res.status(500).send(err.message)}
   
});
/*
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
   */ 
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

