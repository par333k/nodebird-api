const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

// cors 처리, cors는 프록시 서버를 통해서도 해결가능. 서버끼리는 cors 가 일어나지 않기때문이다. http-proxy-middleware 같은 패키지 참고
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({
        where: { host: url.parse(req.get('origin')).host }, // url.parse를 이용해 http나 https 떼어낸다
    });
    if (domain) {
        cors({
            origin: req.get('origin'), // origin 속성에 허용할 도메인을 따로 적어도 가능, 여러개일 경우 배열로 처리.
            credential: true,
        })(req, res, next);  // 미들웨어 커스터마이징, router.use(cors()); 와 router.use((req, res, next) => { cors()(req, res, next); }); 는 같다
    } else { // 일치하지 않으면 cors 에러
        next();
    }
});


/*router.use(cors({ // 이대로 쓰면 브라우저에서 키가 노출되기 때문에 domain 체크를 함께 해야함
    credientials: true,
}));*/

router.post('/token', apiLimiter, async (req, res) => {
    const { clientSecret } = req.body;
    try {
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if (!domain) {
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        }
        const token = jwt.sign({
            id: domain.User.id,
            nick: domain.User.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '30m', // 30분
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if (!hashtag) {
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});
// 나를 팔로워 하는 리스트
router.get('/followers', async (req, res, next) => {
    try {
        console.log(req.query);
        const user = await User.findOne({where: {email: req.query.id }});
        console.log(user);
        if (user) {
            // following id가 user.id인 사람들 전체 조회
            const followers = await user.getFollowers();
            console.log(followers);
            res.json(followers);
        } else  {
            res.status(404).send('no followers');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

//내가 팔로잉 하는 리스트
router.get('/followings', async (req, res, next) => {
    try {
        console.log(req.query);
        const user = await User.findOne({where: {email: req.query.id }});
        console.log(user);
        if (user) {
            // follower id가 user.id인 사람들 전체 조회
            const followings = await user.getFollowings();
            console.log(followings);
            res.json(followings);
        } else  {
            res.status(404).send('no followers');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});
module.exports = router;