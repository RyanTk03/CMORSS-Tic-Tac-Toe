import { Request, Response } from 'express';
import { User } from '../models/User.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';

export const signup = async (req: Request, res: Response, next: any) => {
  const { pseudo, password } = req.body;

  if (!pseudo || !password || pseudo === '' || password === '') {
    next(errorHandler(400, 'All fields are required'));
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ pseudo, password: hashedPassword });

  try {
    await newUser.save();
    res.json('Signup success');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req: Request, res: Response, next: any) => {
  const { pseudo, password } = req.body;

  if (!pseudo || !password || pseudo.trim() === '' || password.trim() === '') {
    return next(errorHandler(400, 'Please fill out all required fields.'));
  }

  try {
    const validUser = await User.findOne({ pseudo });
    if (!validUser) {
      return next(
        errorHandler(400, 'Invalid username or password. Please try again.')
      );
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(
        errorHandler(400, 'Invalid username or password. Please try again.')
      );
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET!);

    const userObject = validUser.toObject();

    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .json({
        pseudo: userObject.pseudo,
        wins: userObject.wins,
        losses: userObject.losses,
        gamesPlayed: userObject.gamesPlayed,
      });
  } catch (error) {
    return next(errorHandler(500, 'Internal server error'));
  }
};
