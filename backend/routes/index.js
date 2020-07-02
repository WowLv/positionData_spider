var express = require('express');
var router = express.Router();
var posDetail = require('../controllers/posDetailController')


router.post('/posDetail', posDetail.postPosDetail)
router.get('/getPosDetail', posDetail.getPosDetail)
router.get('/searchPos', posDetail.searchPos)
router.get('/getPosList', posDetail.getPosList)

module.exports = router;
