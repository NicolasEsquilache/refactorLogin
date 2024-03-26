import { Router } from 'express';
import User from '../dao/models/user.js'
import passport from 'passport';
import { createHash, isValidatePassword } from '../pass.js'
const router = Router();

router.post('/register', passport.authenticate('register', { failureRedirect: '/failregister' }), async (req, res) => {
    res.send({ status: "success", message: "usuario registrado" })
});

router.post("/login", passport.authenticate('login', { failureRedirect: '/faillogin' }), async (req, res) => {
    if (!req.user) return res.status(400).send({ status: 'error', error: 'Credenciales inválidas' })

    req.session.user = {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        age: req.user.age,
        email: req.user.email
    }
    //res.send({ status: "success", payload: req.user })   
    res.redirect('/login')
});

router.get("/github", passport.authenticate('github', { scope: ['user:email'] }), async (req, res) => { })

router.get("/githubcallback", passport.authenticate('github', { failureRedirect: '/login' }), async (req, res) => {
    req.session.user = req.user
    //res.send('You are logged in successfully with Github!')
    res.redirect('/login')
})

//Restore password
router.post('/restore', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ status: "error", error: "Correo electrónico y nueva contraseña requeridos" });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { password: createHash(password) },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ status: "error", error: "Usuario no encontrado" });
        }

        req.session.user = updatedUser;
        res.redirect('/login'); 
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "error", error: "Error al actualizar la contraseña" });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login');
    });
});


export default router;
