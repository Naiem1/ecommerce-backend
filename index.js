const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

const server = jsonServer.create();
const router = jsonServer.router('db.json'); // Change this to your data file name
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

const PORT = process.env.PORT || 2000;

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Custom authentication middleware
const authenticate = (req, res, next) => {
  // Your authentication logic here
  next();
};

// Attach authentication middleware
server.use(authenticate);

// Attach your other routes here
server.get('/products', (req, res) => {
  const products = router.db.get('products').value();

  return res.status(200).json({ products });
});

server.post('/register', (req, res) => {
  const newUser = req.body;
  console.log(newUser);
  const { phone } = newUser;
  const user = router.db.get('users').find({ phone }).value();

  if (user) {
    return res.status(401).json({ message: 'User already Exists' });
  }

  newUser.id = shortid();
  newUser.role = 'USER';
  router.db.get('users').push(newUser).write();
  return res
    .status(201)
    .json({ message: 'User registered successfully', user: newUser });
});

server.post('/login', (req, res) => {
  const { phone, password } = req.body;
  const user = router.db.get('users').find({ phone }).value();

  if (!user) {
    return res.status(401).json({ message: 'Invalid Credential' });
  }

  return res.status(201).json({ message: 'Login successful', user });
});



server.post('/place-order', (req, res) => {
  const { userId, products, address } = req.body;
  console.log(userId, products);
  console.log('triggered');

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const orderedProducts = products;

  console.log('products', products);

  if (orderedProducts.some((product) => !product)) {
    return res
      .status(400)
      .json({ message: 'One or more products are invalid' });
  }

  const newOrder = {
    id: shortid(),
    userId,
    address,
    products: orderedProducts,
  };
  router.db.get('orders').push(newOrder).write();

  return res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
});


server.get('/ordered-products', (req, res) => {
  const orderedProducts = router.db
    .get('orders')
    .sortBy('price')
    .map((product) => {
      const user = router.db.get('users').find({ id: product.userId }).value();
      const address = router.db
        .get('addresses')
        .find({ orderId: product.userId });
      return { ...product, user, address };
    })
    .value();

  return res.json(orderedProducts);
});



server.get('/users/:userId/orders', (req, res) => {
  const userId = parseInt(req.params.userId);
  console.log('=====userId====', userId);
  const orders = router.db.get('orders').filter({ userId }).value();
  res.json(orders);
});



server.use(router);

server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
