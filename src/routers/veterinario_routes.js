// Importar Router de Express
import { Router } from 'express';

// Crear una instancia de Router()
const router = Router();

// Importar métodos del controlador
import {
    login,
    perfil,
    registro,
    confirmEmail,
    listarVeterinarios,
    detalleVeterinario,
    actualizarPerfil,
    actualizarPassword,
    recuperarPassword,
    comprobarTokenPasword,
    nuevoPassword,
} from "../controllers/veterinario_controller.js";

// Importar middleware de autenticación
import verificarAutenticacion from '../middlewares/autenticacion.js';

// Importar middleware de validación
import { validacionVeterinario } from '../middlewares/validacionVeterinario.js';

// Rutas públicas
router.post("/login", login);
router.post("/registro", validacionVeterinario, registro);
router.get("/confirmar/:token", confirmEmail);
router.get("/veterinarios", listarVeterinarios);
router.post("/recuperar-password", recuperarPassword);
router.get("/recuperar-password/:token", comprobarTokenPasword);
router.post("/nuevo-password/:token", nuevoPassword);

// Rutas privadas
router.get("/perfil", verificarAutenticacion, perfil);
router.put('/veterinario/actualizarpassword', verificarAutenticacion, actualizarPassword);
router.get("/veterinario/:id", verificarAutenticacion, detalleVeterinario);
router.put("/veterinario/:id", verificarAutenticacion, actualizarPerfil);

// Exportar la variable router
export default router;


/*
Este código define las rutas para manejar las solicitudes relacionadas con los veterinarios. 
Las rutas públicas no requieren autenticación y permiten al usuario realizar acciones como iniciar sesión, 
registrarse, confirmar correo electrónico, listar veterinarios, recuperar contraseña y cambiar contraseña. 
Las rutas privadas requieren autenticación y permiten al usuario acceder a su perfil, actualizar su contraseña y actualizar su perfil.
Cada ruta está asociada a un controlador específico que maneja la lógica de negocio correspondiente. Las solicitudes HTTP POST, GET y PUT se utilizan para realizar estas operaciones.
*/
