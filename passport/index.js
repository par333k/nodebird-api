const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
    // 사용자 정보 객체를 세션에 아이디로 저장
    passport.serializeUser((user, done) => { // 로그인 시 실행되며 req.session(세션) 객체에 어떤 데이터를 저장할지 정하는 메서드
        done(null, user.id); // 첫번째 인수는 에러 발생시 사용, 두번째 인수는 저장하고 싶은데이터
    });

    // 세션에 저장한 아이디를 통해 사용자 정보 객체를 불러오는 것
    passport.deserializeUser((id, done) => { // 매 요청시마다 실행, done의 두 번째 인수로 넣었던 데이터가 이 함수의 매개변수가 된다.
        // 라우터가 실행되기 전에 deserializeUser 가 실행되므로 해당부분을 캐싱해두면 부담을 덜 수 있다. 그러나 캐싱이 유지되는 동안 팔로워/팔로잉 정보가 갱신되지 않는 부분은 처리해야한다.
       User.findOne({
            where: { id },
            include: [{
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followers',
            }, {
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followings',
            }],
       })
           .then(user => done(null, user))
           .catch(err => done(err));
    });

    local();
    kakao();
}

