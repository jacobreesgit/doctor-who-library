"""Value object for content types."""

from enum import Enum


class ContentType(str, Enum):
    """Enumeration of Doctor Who content types."""

    # Television
    BBC_TELEVISION = "BBC Television"
    BBC_TELEVISION_CLASS = "BBC Television (Class)"
    BBC_TELEVISION_SJA = "BBC Television (The Sarah Jane Adventures)"
    BBC_TELEVISION_STARZ = "BBC Television / Starz"
    DISNEY_TELEVISION = "Disney Television"
    TV = "TV"

    # Audio Stories
    BBC_AUDIO = "BBC Audio"
    BBC_AUDIO_DOOMS_DAY = "BBC Audio (Doom's Day)"
    BBC_AUDIO_BIG_FINISH = "BBC Audio / Big Finish Productions"
    BBC_RADIO_4 = "BBC Radio 4"
    BIG_FINISH = "Big Finish Productions"
    BIG_FINISH_BERNICE = "Big Finish Productions (Bernice Summerfield)"
    BIG_FINISH_DARK_GALLIFREY = "Big Finish Productions (Dark Gallifrey)"
    BIG_FINISH_DONNA = "Big Finish Productions (Donna Noble: Kidnapped!)"
    BIG_FINISH_DOOMS_DAY = "Big Finish Productions (Doom's Day)"
    BIG_FINISH_JAGO_LITEFOOT = "Big Finish Productions (Jago and Litefoot)"
    BIG_FINISH_JENNY = "Big Finish Productions (Jenny)"
    BIG_FINISH_MASTER = "Big Finish Productions (Master!)"
    BIG_FINISH_SUSANS_WAR = "Big Finish Productions (Susan's War)"
    BIG_FINISH_NEW_EARTH = "Big Finish Productions (Tales from New Earth)"
    BIG_FINISH_RIVER_SONG = "Big Finish Productions (The Diary of River Song)"
    BIG_FINISH_CAPTAIN_JACK = "Big Finish Productions (The Lives of Captain Jack)"
    BIG_FINISH_PATERNOSTER = "Big Finish Productions (The Paternoster Gang)"
    BIG_FINISH_ROBOTS = "Big Finish Productions (The Robots)"
    BIG_FINISH_WAR_DOCTOR = "Big Finish Productions (The War Doctor)"
    BIG_FINISH_WAR_MASTER = "Big Finish Productions (The War Master)"

    # Comics
    DWM_COMIC = "Doctor Who Magazine Comic"
    DWM_COMIC_STRIP = "Doctor Who Magazine Comic Strip"
    TITAN_COMICS = "Titan Comics"
    BBC_COMIC_CREATOR = "BBC Comic Creator"

    # Books
    BBC_BOOKS = "BBC Books"
    MISSING_ADVENTURES = "The Missing Adventures"

    # Minisodes
    BBC_MINISODE = "BBC Minisode"
    BBC_MINISODE_IDENTS = "BBC Minisode (Idents)"
    BBC_MINISODE_TRAILER = "BBC Minisode (Trailer)"
    BBC_TV_MINISODE = "BBC Television Minisode"

    # Webcasts
    BBCI_WEBCAST = "BBCi Webcast"
    BIG_FINISH_WEBCAST = "Big Finish Webcast"
    BBC_ONLINE = "BBC Online"

    # Video Games
    BBC_ADVENTURE_GAMES = "BBC Adventure Games"

    # Documentaries
    DOCUMENTARY = "Documentary"

    def __str__(self) -> str:
        return self.value

    def get_wiki_suffix(self) -> str:
        """Get the appropriate wiki suffix for searches."""
        audio_types = {
            self.BBC_AUDIO,
            self.BBC_AUDIO_DOOMS_DAY,
            self.BBC_AUDIO_BIG_FINISH,
            self.BBC_RADIO_4,
            self.BIG_FINISH,
            self.BIG_FINISH_BERNICE,
            self.BIG_FINISH_DARK_GALLIFREY,
            self.BIG_FINISH_DONNA,
            self.BIG_FINISH_DOOMS_DAY,
            self.BIG_FINISH_JAGO_LITEFOOT,
            self.BIG_FINISH_JENNY,
            self.BIG_FINISH_MASTER,
            self.BIG_FINISH_SUSANS_WAR,
            self.BIG_FINISH_NEW_EARTH,
            self.BIG_FINISH_RIVER_SONG,
            self.BIG_FINISH_CAPTAIN_JACK,
            self.BIG_FINISH_PATERNOSTER,
            self.BIG_FINISH_ROBOTS,
            self.BIG_FINISH_WAR_DOCTOR,
            self.BIG_FINISH_WAR_MASTER,
        }

        tv_types = {
            self.BBC_TELEVISION,
            self.BBC_TELEVISION_CLASS,
            self.BBC_TELEVISION_SJA,
            self.BBC_TELEVISION_STARZ,
            self.DISNEY_TELEVISION,
            self.TV,
            self.BBC_MINISODE,
            self.BBC_MINISODE_IDENTS,
            self.BBC_MINISODE_TRAILER,
            self.BBC_TV_MINISODE,
        }

        comic_types = {
            self.DWM_COMIC,
            self.DWM_COMIC_STRIP,
            self.TITAN_COMICS,
            self.BBC_COMIC_CREATOR,
        }

        book_types = {
            self.BBC_BOOKS,
            self.MISSING_ADVENTURES,
        }

        webcast_types = {
            self.BBCI_WEBCAST,
            self.BIG_FINISH_WEBCAST,
            self.BBC_ONLINE,
        }

        if self in audio_types:
            return "audio story"
        elif self in tv_types:
            return "TV story"
        elif self in comic_types:
            return "comic story"
        elif self in book_types:
            return "novel"
        elif self in webcast_types:
            return "webcast"
        elif self == self.BBC_ADVENTURE_GAMES:
            return "video game"
        elif self == self.DOCUMENTARY:
            return "documentary"
        else:
            return "story"
