class User {
  constructor(
    email = "",
    firstname = "",
    lastname = "",
    password = "",
    avatar_url = "",
    id = null,
    isverified = false,
    expirationdate = new Date(),
    token = ""
  ) {
    this.email = email;
    this.firstname = firstname;
    this.lastname = lastname;
    this.password = password;
    this.avatar_url = avatar_url;
    this.id = id;
    this.isverified = isverified;
    this.expirationdate = expirationdate;
    this.token = token;
  }
}

exports.User = User;
