from bson import ObjectId

class User:
    def __init__(self, email, password, role="student"):
        self.email = email
        self.password = password
        self.role = role  # "student" or "teacher"
        self._id = ObjectId()

    def to_dict(self):
        return {
            '_id': self._id,
            'email': self.email,
            'password': self.password,
            'role': self.role
        }
