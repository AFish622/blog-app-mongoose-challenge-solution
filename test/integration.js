const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {TEST_DATABASE_URL, PORT} = require('../config');
const {app, runServer, closeServer} = require('../server');

chai.use(chaiHttp);

function seedBlogData() {
	const seedData = [];
	for (let i = 1; i <= 10; i++) {
		seedData.push({
			author: {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName()
			},
			title: faker.lorem.sentence(),
			content: faker.lorem.text()
		})
	}
	return BlogPost.insertMany(seedData);
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Generate blog post API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	})
	beforeEach(function() {
		return seedBlogData();
	})
	afterEach(function() {
		return tearDownDb()
	})
	after(function() {
		return closeServer();
	})

	describe('GET endpoint', function() {
		it ('Should get all blog post', function() {
			let res;
			return chai.request(app)
			.get('/posts')
			.then(function(_res) {
				res = _res;
				console.log(res);
				res.body.should.have.length.of.at.least(1);
				return BlogPost.count();
				then(function(count) {
					res.body.resaurants.should.have.length.of(count);
				})
			})
		})

		it('should return blogs with right fields', function() {
			let resBlog;
			return chai.request(app)
			.get('/posts')
			then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('array');
				res.body.should.have.length.of.at.least(1);
				res.body.forEach(function(post) {
					post.should.be.a('object');
					post.should.include.keys('title', 'author', 'content');
				});
				resBlog = res.body[0];
				return BlogPost.findById(resBlog.id);
			})
			.then(function(post) {
				resBlog.id.should.equal(post.id);
				resBlog.title.should.equal(post.title);
				resBlog.author.should.contain(post.author.firstName);
				resBlog.author.should.contain(post.author.lastName);
				resBlog.content.should.equal(post.content)
			});
		})
	})

	describe('Post endpoint', function() {
		it('Should add posts to BlogPost', function() {
			const newPost = {
				title: 'New Title',
				author: {
					firstName: 'Joe',
					lastName: 'Thomas'
				},
				content: 'New Content'
			}

			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.should.be.a('object');
					res.body.should.include.keys('author', 'title', 'content');
					res.body.content.should.equal(newPost.content);
					return BlogPost.findById(res.body.id);
				})
				.then(function(post) {
					post.title.should.equal(newPost.title);
					post.content.should.equal(newPost.content);
				})
		})
	})
})

describe('PUT endpoint', function() {
	it('should update proper information', function() {
		const updateData = {
			title: 'Newest Title',
			content: 'Newest Content'
		};

		return BlogPost
		.findOne()
		.exec()
		.then(function(post) {
			updateData.id = post.id;
			return chai.request(app)
			.put(`/posts/${post.id}`)
			.send(updateData);
		})
		.then(function(res) {
			res.should.have.status(201);
			res.should.be.json;
			res.body.should.be.a('object');
			res.body.title.should.equal(updateData.title);
			res.body.content.should.equal(update.data.content);
			return BlogPost.findById(res.body.id).exec();
		})
		.then(function(post) {
			post.title.should.equal(updateData.title);
			post.content.should.equal(updateData.content);
		})
	})
	describe('DELETE endpoint', function(){
		it('Should delete post from BlogPost', function() {
			let post;
			return BlogPost
			.findOne();
			.exec();
			then(function(_post) {
				post = _post;
				return chai.request(app).delete(`/posts/${post.id}`);
			})
			.then(function(res) {
				res.should.have.status(204);
				return BlogPost.findbyId(post.id).exec();
			})
			.then(function(_post) {
				should.not.exist(_post)
			})
		})
	})	

})

