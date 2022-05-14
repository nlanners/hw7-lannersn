const router = require('express').Router();

router.use('/boats', require('./boats'));
router.use('/owners', require('./owners'));

module.exports = router;