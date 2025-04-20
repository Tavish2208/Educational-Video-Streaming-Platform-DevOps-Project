from bson import ObjectId


class WatchlistItem:
    def __init__(self, user_id, videos=None):
        self.user_id = user_id
        self.videos = videos or []  
        
        self._id = ObjectId()

    def to_dict(self):
        return {
            "_id": self._id,
            "user_id": self.user_id,
            "videos": [video for video in self.videos],  
        }
