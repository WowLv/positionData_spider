var express = require('express');
var router = express.Router();
var posDetail = require('../controllers/posDetailController')

router.post('/supplement', posDetail.supplement)
router.post('/posDetail', posDetail.postPosDetail)
router.get('/getPosDetail', posDetail.getPosDetail)
router.get('/searchPos', posDetail.searchPos)
router.get('/getPosList', posDetail.getPosList)
router.get('/getId', posDetail.getId)

module.exports = router;
