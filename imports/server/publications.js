Meteor.publish('users', ()=> {
  return Users.find();
});

Meteor.publish('lessons', ()=> {
  return Lessons.find();
});
