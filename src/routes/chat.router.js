import express from 'express';

const router = express.Router();

router.get('/chat', (req, res) => {
    res.render('chat', { style: '/css/styles.css' });
});

export default router;
