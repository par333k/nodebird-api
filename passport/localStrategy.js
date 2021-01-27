const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');
module.exports = () => {
    passport.use(new LocalStrategy({  // 첫 번째 인수는 전략에 관한 설정, 
        usernameField: 'email',
        passwordField: 'password',
    }, async (email, password, done) => { // 실제 전략을 수행하는 함수, 첫 번째 인수의 데이터는 해당 함수의 매개변수가 됨, done은 passport.authenticate의 콜백 함수
        try {
            const exUser = await User.findOne({ where: { email } });
            if (exUser) {
                const result = await bcrypt.compare(password, exUser.password);
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
                }
            } else {
                done(null, false, { message: '가입되지 않은 회원입니다.' });
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};