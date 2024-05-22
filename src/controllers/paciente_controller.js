// IMPORTAR EL MODELO
import Paciente from "../models/Paciente.js"; // Importa el modelo Paciente para interactuar con la colección de pacientes en la base de datos
import Tratamiento from "../models/Tratamiento.js"; // Importa el modelo Tratamiento para interactuar con la colección de tratamientos en la base de datos

// IMPORTAR EL MÉTODO sendMailToPaciente
import { sendMailToPaciente } from "../config/nodemailer.js"; // Importa la función sendMailToPaciente desde el archivo nodemailer.js para enviar correos electrónicos

import mongoose from "mongoose"; // Importa mongoose para trabajar con la base de datos MongoDB
import generarJWT from "../helpers/crearJWT.js"; // Importa la función generarJWT desde el archivo crearJWT.js para generar tokens JWT

// Método para el proceso de login
const loginPaciente = async(req,res)=>{
    const {email,password} = req.body // Extrae el email y la contraseña del cuerpo de la solicitud

    // Verifica si algún campo del cuerpo de la solicitud está vacío
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})

    // Busca un paciente en la base de datos por su email
    const pacienteBDD = await Paciente.findOne({email})

    // Si no se encuentra ningún paciente con el email proporcionado, responde con un mensaje de error
    if(!pacienteBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no se encuentra registrado"})

    // Comprueba si la contraseña proporcionada coincide con la contraseña almacenada para el paciente en la base de datos
    const verificarPassword = await pacienteBDD.matchPassword(password)

    // Si la contraseña no coincide, responde con un mensaje de error
    if(!verificarPassword) return res.status(404).json({msg:"Lo sentimos, el password no es el correcto"})

    // Genera un token JWT para el paciente
    const token = generarJWT(pacienteBDD._id,"paciente")

    // Extrae algunos datos específicos del paciente para incluir en la respuesta
	const {nombre,propietario,email:emailP,celular,convencional,_id} = pacienteBDD

    // Responde con un objeto JSON que contiene el token JWT y otros datos del paciente
    res.status(200).json({
        token,
        nombre,
        propietario,
        emailP,
        celular,
        convencional,
        rol:"paciente",
        _id
    })
}

// Método para ver el perfil 
const perfilPaciente =(req,res)=>{
    // Elimina algunos campos sensibles del objeto pacienteBDD antes de responder
    delete req.pacienteBDD.ingreso
    delete req.pacienteBDD.sintomas
    delete req.pacienteBDD.salida
    delete req.pacienteBDD.estado
    delete req.pacienteBDD.veterinario
    delete req.pacienteBDD.createdAt
    delete req.pacienteBDD.updatedAt
    delete req.pacienteBDD.__v
    // Responde con el perfil del paciente (sin los campos eliminados)
    res.status(200).json(req.pacienteBDD)
}

// Método para listar pacientes
const listarPacientes = async (req,res)=>{
    // Verifica si la solicitud contiene datos de pacienteBDD
    if (req.pacienteBDD && "propietario" in req.pacienteBDD){
        // Si el pacienteBDD existe y es propietario, busca pacientes asociados a ese propietario
        const pacientes = await Paciente.find(req.pacienteBDD._id).select("-salida -createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
        res.status(200).json(pacientes)
    }
    else{
        // Si no es propietario, busca pacientes asociados al veterinarioBDD que hizo la solicitud
        const pacientes = await Paciente.find({estado:true}).where('veterinario').equals(req.veterinarioBDD).select("-salida -createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
        res.status(200).json(pacientes)
    }
}

// Método para ver el detalle de un paciente en particular
const detallePaciente = async(req,res)=>{
    const {id} = req.params // Extrae el ID del paciente de los parámetros de la solicitud
    // Verifica si el ID es válido
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el paciente ${id}`});
    // Busca al paciente por su ID y lo popula con la información del veterinario asociado y los tratamientos asociados
    const paciente = await Paciente.findById(id).select("-createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
    const tratamientos = await Tratamiento.find({estado:true}).where('paciente').equals(id)
    // Responde con el detalle del paciente y sus tratamientos
    res.status(200).json({
        paciente,
        tratamientos
    })
}

// Método para registrar un paciente
const registrarPaciente = async(req,res)=>{
    // desestructura el email
    const {email} = req.body
    // Valida todos los campos del cuerpo de la solicitud
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    // Busca si el email ya está registrado en la base de datos
    const verificarEmailBDD = await Paciente.findOne({email})
    // Si el email ya está registrado, responde con un mensaje de error
    if(verificarEmailBDD) return res.status(400).json({msg:"Lo sentimos, el email ya se encuentra registrado"})
    // Crea una nueva instancia de Paciente con los datos proporcionados en el cuerpo de la solicitud
    const nuevoPaciente = new Paciente(req.body)
    // Genera una contraseña aleatoria
    const password = Math.random().toString(36).slice(2)
    // Encripta la contraseña
    nuevoPaciente.password = await nuevoPaciente.encryptPassword("vet"+password)
    // Envía un correo electrónico al paciente con la contraseña
    await sendMailToPaciente(email,"vet"+password)
    // Asocia el paciente con el veterinario que hizo la solicitud
    nuevoPaciente.veterinario=req.veterinarioBDD._id
    // Guarda el paciente en la base de datos
    await nuevoPaciente.save()
    // Responde con un mensaje de éxito
    res.status(200).json({msg:"Registro exitoso del paciente y correo enviado"})
}



// Método para actualizar un paciente
const actualizarPaciente = async(req,res)=>{
    const {id} = req.params // Extrae el ID del paciente de los parámetros de la solicitud

    // Verifica si algún campo del cuerpo de la solicitud está vacío
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})

    // Verifica si el ID del paciente es válido
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el paciente ${id}`});

    // Busca y actualiza el paciente en la base de datos utilizando el ID proporcionado
    await Paciente.findByIdAndUpdate(req.params.id,req.body)

    // Responde con un mensaje de éxito
    res.status(200).json({msg:"Actualización exitosa del paciente"})
}

// Método para eliminar(dar de baja) un paciente
const eliminarPaciente = async (req,res)=>{
    const {id} = req.params // Extrae el ID del paciente de los parámetros de la solicitud

    // Verifica si algún campo del cuerpo de la solicitud está vacío
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})

    // Verifica si el ID del paciente es válido
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el paciente ${id}`})

    const {salida} = req.body // Extrae la fecha de salida del cuerpo de la solicitud

    // Actualiza el paciente en la base de datos, estableciendo la fecha de salida y el estado en false
    await Paciente.findByIdAndUpdate(req.params.id,{salida:Date.parse(salida),estado:false})
    
    // Responde con un mensaje de éxito
    res.status(200).json({msg:"Fecha de salida del paciente registrada exitosamente"})
}

// Exporta los métodos de la API relacionados con la gestión de pacientes
export {
    loginPaciente,
    perfilPaciente,
    listarPacientes,
    detallePaciente,
    registrarPaciente,
    actualizarPaciente,
    eliminarPaciente
}
