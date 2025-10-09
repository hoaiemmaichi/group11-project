let users = [];

exports.getUsers = (req, res) => res.json(users);

exports.createUser = (req, res) => {
  const newUser = { id: Date.now(), ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
};
