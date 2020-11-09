const express = require('express');
const app = express();
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cors())

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database : 'facerec'
  }
})

app.get('/', (req, res) => {
	res.send('success')
})
//sign in

app.post('/signin', (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect form submission')
	}
	db.select('email', 'hash').from('login')
	.where('email', '=', email)
	.then(data => {
		const isValid = bcrypt.compareSync(password, data[0].hash);
		if (isValid) {
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user => {
				console.log(user[0])
				res.json(user[0])
			})
			.catch(err => res.status(400).json('unable to get user'))
		} else {
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err => res.status(400).json('wrong credentials'))
})

//register

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;
	if (!email || !name || !password) {
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
			email: loginEmail[0],
			name: name,
			joined: new Date()
			})
			.then(user => {
			res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
		.catch(err => res.status(400).json('unable to register'))
})


//ID page

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select('*').from('users').where({id})
	.then(user => {
		if (user.length) {
			res.json(user[0])
		} else {
			res.status(400).json('Not found')
		}

	})
	.catch(err => {res.status(400).json('error getting user')})
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users').where('id', '=', id)
  	.increment('entries', 1)
  	.returning('entries')
  	.then(entries => {
  	res.json(entries[0])
  })
  	.catch(err => res.status(404).json('unable to get entries'))
})

//

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });


app.listen(3000, () => {
	console.log("working on 3000");
})

/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user(updated count)


*/