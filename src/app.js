import express from 'express'
import Cors from 'cors'

const api = express()
api.use(Cors)
const port = 5000


api.listen(port, () => console.log(`Servidor iniciado na porta ${port}`))