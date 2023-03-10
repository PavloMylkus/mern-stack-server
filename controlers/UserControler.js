import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UserModel from "../models/User.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";


export const register = async (req, res) => {
	try {
		//кодування паролю
		const password = req.body.password;
		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash(password, salt)
		//створення user
		const doc = new UserModel({
			email: req.body.email,
			fullName: req.body.fullName,
			passwordHash: hash,
			avatarUrl: req.body.avatarUrl,
		})
		//зберігаєм user в MongoDB
		const user = await doc.save();
		//створюєм токен реєстрації для usera
		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d'
			})

		const { passwordHash, ...userData } = user._doc;

		res.json({
			...userData,
			token
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({
			message: 'Не вдалось зареєструватися',
		})
	}

}

export const login = async (req, res) => {
	try {
		//знаходимо користувача за email
		const user = await UserModel.findOne({ email: req.body.email })

		if (!user) {
			return res.status(404).json({
				message: "Користувача не знайдено"
			})
		}
		//перевірка чи сходяться паролі
		const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

		if (!isValidPass) {
			return res.status(401).json({
				message: 'Непрвильний логін або пароль'
			})
		}

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d'
			})
		const { passwordHash, ...userData } = user._doc;

		res.json({
			...userData,
			token
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({
			message: 'Не вдалось авторизуватися',
		})
	}
}

export const getMe = async (req, res) => {
	try {
		const user = await UserModel.findById(req.userId);
		if (!user) {
			return res.status(404).json({
				message: 'Користувача не знайдено'
			})
		}
		const { passwordHash, ...userData } = user._doc;

		res.json({ userData })
	} catch (error) {
		console.log(error)
		res.status(500).json({
			message: 'Не вдалось пройти автентифікацію',
		})
	}
}