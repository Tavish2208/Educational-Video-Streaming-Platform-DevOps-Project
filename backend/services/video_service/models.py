class Video:
    def __init__(self, id, title, description, url, thumbnail_url, upload_date=None, duration=None):
        self.id = id
        self.title = title
        self.description = description
        self.url = url
        self.thumbnail_url = thumbnail_url
        self.upload_date = upload_date
        self.duration = duration

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "url": self.url,
            "thumbnailUrl": self.thumbnail_url,
            "uploadDate": self.upload_date,
            "duration": self.duration,
        }
