Meteor.methods({
  'get.url'() {
    return process.env.ROOT_URL;
  },

  'get.user'(id) {
    Users.findOne(userId);
  },

  'add.user'(user) {
    Users.insert({
      id: user.id,
      name: user.name,
      type: user.type,
      createdAt: new Date().valueOf()
    });
  }
});
