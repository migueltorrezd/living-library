export type EditorialLink = {label:string; url:string};
export type BookEditorial = {
 summary:string[];
 biography:string;
 authorLink:EditorialLink;
 reading?:{id:number; note:string; chapter:string; excerpt:string};
 praise:{text:string; name:string; attribution:string; url:string}[];
 resources?:{title:string; description:string; link:EditorialLink}[];
};

/** Original summaries; edition sources are recorded in model-manifest.json. */
export const BOOK_EDITORIAL:Record<string,BookEditorial>={
  "wealth-of-nations": {
    "summary": [
      "How does the work of individuals become the wealth of a society? Beginning with the division of labour, Adam Smith follows the connections between wages, prices, trade and the institutions that shape economic life. His examples move from the pin workshop to international commerce, making an argument about prosperity through the details of everyday work.",
      "First published in 1776, this is also an inquiry into the responsibilities of government and the interests that can distort markets. The questions reach well beyond the familiar phrase “invisible hand”: who benefits from growth, what makes exchange possible, and how should a nation judge its wealth?"
    ],
    "biography": "Adam Smith was a Scottish moral philosopher and political economist. Born in Kirkcaldy in 1723, he studied at Glasgow and Oxford before returning to teach. At Glasgow he held the chair of Moral Philosophy and published The Theory of Moral Sentiments in 1759. After travelling in Europe as a tutor, he returned to Kirkcaldy to work on The Wealth of Nations. He later served as a Commissioner of Customs in Edinburgh and as Rector of the University of Glasgow.",
    "authorLink": {
      "label": "Life at Glasgow",
      "url": "https://universitystory.gla.ac.uk/people/WH0016"
    },
    "reading": {
      "id": 3300,
      "note": "Historical text from Project Gutenberg. The publisher’s introductions and apparatus are not included.",
      "chapter": "Of the division of labour",
      "excerpt": "The greatest improvements in the productive powers of labour, and the greater part of the skill, dexterity, and judgment, with which it is anywhere directed, or applied, seem to have been the effects of the division of labour."
    },
    "praise": [
      {
        "text": "an effort to see to the bottom of things.",
        "name": "Robert L. Heilbroner",
        "attribution": "Quoted by Everyman’s Library",
        "url": "https://www.penguinrandomhouse.com/books/672381/the-wealth-of-nations-by-adam-smith-introduction-by-d-d-raphael-and-john-bayley/"
      }
    ]
  },
  "origin-of-species": {
    "summary": [
      "Small differences, preserved across generations, can transform the living world. Darwin builds his case for natural selection through familiar animals and plants, domestication, fossils, migration and the relationships between species. Each observation becomes part of a much larger account of descent with modification.",
      "The book proceeds as a sustained argument, confronting difficulties as well as presenting evidence. Published in 1859, it changed how life’s diversity could be understood. Its closing image of an entangled bank brings the argument back to the abundance of living things within an ordinary patch of ground."
    ],
    "biography": "Charles Darwin was an English naturalist whose work connected geology, zoology and the study of living organisms. His voyage aboard HMS Beagle gave him a foundation of observations and specimens, while decades of experiments and correspondence helped him develop the theory of natural selection. On the Origin of Species appeared in 1859. He continued investigating variation, human evolution and the expression of emotions, supported by an extensive network of scientific correspondents.",
    "authorLink": {
      "label": "Letters & life",
      "url": "https://darwinproject.ac.uk/people/about-darwin"
    },
    "reading": {
      "id": 1228,
      "note": "The 1859 first edition, transcribed by Project Gutenberg. Modern editorial material is not included.",
      "chapter": "Recapitulation and conclusion",
      "excerpt": "There is grandeur in this view of life, with its several powers, having been originally breathed into a few forms or into one; and that, whilst this planet has gone cycling on according to the fixed law of gravity, from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved."
    },
    "praise": []
  },
  "meditations": {
    "summary": [
      "These are reminders written to oneself: pay attention, meet difficulty without resentment, and distinguish what depends on you from what does not. Marcus Aurelius returns to these questions in short reflections on duty, anger, mortality and the place of a single life within nature.",
      "Written in Greek for private use, the notes retain the intimacy of a mind trying to put its convictions into practice. Their repetitions are part of that effort. This Penguin edition presents Martin Hammond’s translation with an introduction by Diskin Clay."
    ],
    "biography": "Marcus Aurelius was Roman emperor from 161 to 180 CE. Educated in rhetoric and philosophy, he was strongly influenced by Stoicism and the teachings of Epictetus. The responsibilities of imperial rule and military campaigning form the background to his private reflections. He did not write the Meditations as a public treatise: their direct, self-questioning voice preserves the work of someone repeatedly examining his own conduct.",
    "authorLink": {
      "label": "About Marcus Aurelius",
      "url": "https://www.penguin.co.uk/books/35489/meditations-by-aurelius-marcus/9780141395869"
    },
    "reading": {
      "id": 2680,
      "note": "Historical English text from Project Gutenberg, distinct from Martin Hammond’s translation in the displayed edition.",
      "chapter": "The first book",
      "excerpt": "Of my grandfather Verus I have learned to be gentle and meek, and to refrain from all anger and passion. From the fame and memory of him that begot me I have learned both shamefastness and manlike behaviour."
    },
    "praise": [
      {
        "text": "the work of an unusually gifted translator",
        "name": "Malcolm Heath",
        "attribution": "Greece & Rome, on Hammond’s translation",
        "url": "https://www.penguin.co.uk/books/35489/meditations-by-aurelius-marcus/9780141395869"
      },
      {
        "text": "a sparkling and sympathetic introduction.",
        "name": "John Taylor",
        "attribution": "Journal of Classics Teaching, on Diskin Clay’s introduction",
        "url": "https://www.penguin.co.uk/books/35489/meditations-by-aurelius-marcus/9780141395869"
      }
    ]
  },
  "art-of-war": {
    "summary": [
      "The Art of War treats conflict as a problem of judgement before it becomes a contest of force. Its thirteen chapters consider planning, terrain, information, timing and the costs of a campaign. Knowing when to avoid a battle matters as much as knowing how to fight one.",
      "The compact form leaves room for interpretation, which helps explain the work’s long life beyond the battlefield. Peter Harris’s translation and introduction place the text in its Chinese setting while preserving the economy of its strategic observations."
    ],
    "biography": "Sun Tzu, or Master Sun, is the name traditionally associated with The Art of War. Chinese historical tradition identifies him as a military strategist serving the kingdom of Wu, but the relationship between that figure and the surviving text remains debated. The work is therefore best approached as a foundational text of early Chinese strategic thought, rather than as a secure account of a single author’s life.",
    "authorLink": {
      "label": "Text & historical introduction",
      "url": "https://www.gutenberg.org/ebooks/132"
    },
    "reading": {
      "id": 132,
      "note": "Lionel Giles’s 1910 translation and commentary. This differs from Peter Harris’s translation in the displayed edition.",
      "chapter": "Laying plans",
      "excerpt": "The art of war is of vital importance to the State."
    },
    "praise": [
      {
        "text": "a subtle, original mind and a wealth of experience",
        "name": "Peter Harris",
        "attribution": "From the introduction to this edition",
        "url": "https://www.penguinrandomhouse.com/books/600221/the-art-of-war-by-sun-tzu-translated-and-introduced-by-peter-harris/"
      }
    ]
  },
  "principia": {
    "summary": [
      "How can the same principles describe an object falling on Earth and the motion of a planet? Newton’s Principia develops its answer through definitions, laws and geometrical demonstrations. Motion and gravitation become parts of one mathematical account, with consequences for the Earth, Moon, planets and comets.",
      "First published in 1687, the work helped establish the foundations of classical mechanics. The displayed edition uses the modern translation by I. Bernard Cohen and Anne Whitman, with Julia Budenz, based on Newton’s final revised edition of 1726."
    ],
    "biography": "Isaac Newton studied at Trinity College, Cambridge, and became Lucasian Professor of Mathematics in 1669. His work ranged across mathematics, optics and natural philosophy, alongside extensive investigations of theology, chronology and alchemy. The Principia appeared in 1687, followed by Opticks in 1704. Later in life he moved to London, worked at the Royal Mint and served as President of the Royal Society.",
    "authorLink": {
      "label": "The Newton Project",
      "url": "https://newtonproject.ox.ac.uk/his-life-and-work-at-a-glance"
    },
    "reading": {
      "id": 76404,
      "note": "Andrew Motte’s historical translation, in an 1846 edition. It is separate from the modern Cohen–Whitman translation shown here.",
      "chapter": "Axioms, or laws of motion · Law I",
      "excerpt": "Every body perseveres in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed thereon."
    },
    "praise": [
      {
        "text": "he showed that the universe is predictable.",
        "name": "Neil deGrasse Tyson",
        "attribution": "Quoted by University of California Press",
        "url": "https://www.ucpress.edu/books/the-principia-the-authoritative-translation/paper"
      },
      {
        "text": "the indispensable foundation for all subsequent physical sciences.",
        "name": "Simon Schaffer",
        "attribution": "Quoted by University of California Press",
        "url": "https://www.ucpress.edu/books/the-principia-the-authoritative-translation/paper"
      }
    ],
    "resources": [
      {
        "title": "Inside the modern translation",
        "description": "Browse the publisher-linked Google Books preview of the Cohen–Whitman edition, including its contents and available sample pages.",
        "link": {
          "label": "Open the preview",
          "url": "https://books.google.com/books?vid=ISBN9780520290747"
        }
      }
    ]
  },
  "zarathustra": {
    "summary": [
      "After years of solitude, Zarathustra descends from the mountains to speak among people. His journey unfolds through parables, speeches and songs rather than a conventional philosophical argument. Questions about inherited values, self-overcoming and the possibility of affirming life return in changing forms.",
      "Nietzsche gives these ideas a dramatic voice, full of provocation, humour and difficult reversals. The book asks to be interpreted as both literature and philosophy. The displayed Modern Library edition is translated by Walter Kaufmann."
    ],
    "biography": "Friedrich Nietzsche was born in Prussia in 1844 and trained as a classical scholar. Appointed Professor of Classical Philology at Basel in 1869, he left teaching in 1879 because of ill health. His later writing investigated morality, religion, culture and the creation of values, often through aphorisms and literary experiments. A breakdown in 1889 ended his active writing life; he died in 1900.",
    "authorLink": {
      "label": "About Friedrich Nietzsche",
      "url": "https://www.penguinrandomhouse.com/books/121945/thus-spoke-zarathustra-by-friedrich-nietzsche/"
    },
    "reading": {
      "id": 1998,
      "note": "Thomas Common’s historical translation, titled Thus Spake Zarathustra. This is not Walter Kaufmann’s translation.",
      "chapter": "Zarathustra’s prologue",
      "excerpt": "When Zarathustra was thirty years old, he left his home and the lake of his home, and went into the mountains. There he enjoyed his spirit and solitude, and for ten years did not weary of it."
    },
    "praise": []
  },
  "the-republic": {
    "summary": [
      "A conversation about justice grows into the construction of an imagined city. Through Socrates and his companions, Plato asks what a good life requires, how education shapes character, and whether political power can be joined to knowledge rather than ambition.",
      "The arguments move between the individual and the community, reaching the images of the divided line and the cave. The Republic remains demanding because its answers are inseparable from the questions and objections that produce them. This edition pairs A. D. Lindsay’s translation with an introduction by Alexander Nehamas."
    ],
    "biography": "Plato was an Athenian philosopher and a student of Socrates. The trial and death of his teacher helped shape his lifelong concern with philosophy and political life. He founded the Academy in Athens, where Aristotle later studied, and developed his ideas through dialogues rather than systematic textbooks. The Republic brings together many of his enduring interests: justice, knowledge, education and the relationship between a city and its citizens.",
    "authorLink": {
      "label": "About Plato",
      "url": "https://www.penguinrandomhouse.com/books/131794/the-republic-by-plato-translated-by-ad-lindsay-introduction-by-alexander-nehamas/"
    },
    "reading": {
      "id": 1497,
      "note": "Benjamin Jowett’s historical translation. The displayed Everyman’s Library edition uses A. D. Lindsay’s translation.",
      "chapter": "Book I",
      "excerpt": "I was delighted with the procession of the inhabitants; but that of the Thracians was equally, if not more, beautiful."
    },
    "praise": [
      {
        "text": "It is part of the fabric of our common sense.",
        "name": "Alexander Nehamas",
        "attribution": "From the introduction to this edition",
        "url": "https://www.penguinrandomhouse.com/books/131794/the-republic-by-plato-translated-by-ad-lindsay-introduction-by-alexander-nehamas/"
      }
    ]
  },
  "walden": {
    "summary": [
      "What does it cost to live, and which of those costs are worth paying? Thoreau’s account of life beside Walden Pond begins with practical matters: shelter, food, work and money. It expands into close observation of the seasons and a searching examination of habit, independence and attention.",
      "The book compresses more than two years of experience into the movement of a year. Solitude and visitors, a bean field and winter ice become ways of thinking about how to live deliberately. The displayed Beacon Press edition includes an introduction by Bill McKibben."
    ],
    "biography": "Henry David Thoreau was a writer, naturalist and social reformer born in Concord, Massachusetts, in 1817. His time in a small house near Walden Pond became the basis of Walden, while his opposition to slavery and resistance to government injustice informed Civil Disobedience. His extensive journals record a lifetime of close observation. A member of the Transcendentalist circle around Ralph Waldo Emerson, he linked the study of nature with questions of conscience and everyday life.",
    "authorLink": {
      "label": "The Walden Woods Project",
      "url": "https://www.walden.org/what-we-do/library/thoreau/"
    },
    "reading": {
      "id": 205,
      "note": "Historical text from Project Gutenberg, also including Civil Disobedience. Bill McKibben’s introduction is not included.",
      "chapter": "Where I lived, and what I lived for",
      "excerpt": "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived."
    },
    "praise": [
      {
        "text": "the gospel of the present moment.",
        "name": "Robert D. Richardson, Jr.",
        "attribution": "On Bill McKibben’s introduction",
        "url": "https://www.penguinrandomhouse.com/books/643638/walden-by-henry-david-thoreau/hardcover/"
      },
      {
        "text": "this book is well worth the reading",
        "name": "A. P. Peabody",
        "attribution": "North American Review, 1854",
        "url": "https://www.penguinrandomhouse.com/books/643638/walden-by-henry-david-thoreau/hardcover/"
      },
      {
        "text": "a good argument for traveling light",
        "name": "E. B. White",
        "attribution": "Yale Review, 1954",
        "url": "https://www.penguinrandomhouse.com/books/643638/walden-by-henry-david-thoreau/hardcover/"
      }
    ],
    "resources": [
      {
        "title": "A companion for the classroom",
        "description": "The publisher’s teacher’s guide introduces the book and offers discussion questions, classroom activities and suggestions for further reading.",
        "link": {
          "label": "Read the teacher’s guide",
          "url": "https://www.penguinrandomhouse.com/books/643638/walden-by-henry-david-thoreau/teachers-guide/"
        }
      }
    ]
  },
  "cien-anos-de-soledad": {
    "summary": [
      "The lives of the Buendía family unfold through love, solitude and extraordinary events in the town of Macondo.",
      "Generation after generation returns to familiar names, desires and mistakes. The intimate history of a family becomes the history of a town, moving between invention, conflict, memory and forgetting. This anniversary edition pairs the novel with illustrations by Luisa Rivera."
    ],
    "biography": "Gabriel García Márquez was a Colombian novelist, journalist and short-story writer. His fiction joins precise observation of everyday life with extraordinary events, often returning to the landscapes and memories of the Caribbean coast. Awarded the Nobel Prize in Literature in 1982, he made the imaginary town of Macondo part of the world’s literary geography.",
    "authorLink": {
      "label": "About the author & book",
      "url": "https://www.penguinrandomhouse.com/books/196323/cien-anos-de-soledad-50-aniversario--one-hundred-years-of-solitude-by-gabriel-garcia-marquez/9780525562443/"
    },
    "praise": [],
    "resources": [
      {
        "title": "The illustrated anniversary edition",
        "description": "Explore the publisher’s introduction to Luisa Rivera’s illustrated edition.",
        "link": {
          "label": "Explore",
          "url": "https://www.penguinrandomhouse.com/books/196323/cien-anos-de-soledad-50-aniversario--one-hundred-years-of-solitude-by-gabriel-garcia-marquez/9780525562443/"
        }
      }
    ]
  },
  "le-petit-prince": {
    "summary": [
      "A pilot meets a traveller from a tiny planet, and learns to see friendship, love and responsibility with new eyes.",
      "The little traveller’s encounters with adults reveal the strange importance people attach to ownership, authority and counting. Against those habits, the story offers the patient work of knowing another being. This model takes its cover from Gallimard’s seventieth-anniversary edition."
    ],
    "biography": "Antoine de Saint-Exupéry was a French writer and aviator. His experience flying mail routes and travelling across deserts informed books about solitude, friendship and human responsibility. First published in 1943, Le Petit Prince brings those concerns into a fable illustrated with his own drawings.",
    "authorLink": {
      "label": "About the author & book",
      "url": "https://www.cercle-enseignement.com/Ouvrages/Gallimard-Jeunesse/Hors-Serie-Musique/Le-Petit-Prince"
    },
    "praise": []
  },
  "how-to-fail": {
    "summary": [
      "A personal account of failure, useful combinations of skills, and the daily systems that make progress possible.",
      "Rather than treating success as a straight path, Adams examines what can be learned from projects that go wrong. He discusses systems, energy and combinations of ordinary skills, connecting them to examples from his own life. This is the second edition, with the blue illustrated cover."
    ],
    "biography": "Scott Adams created the comic strip Dilbert and wrote books about work, persuasion and personal effectiveness. In this memoir, episodes from his working life become a way to examine failure, useful skills and the habits that support progress.",
    "authorLink": {
      "label": "About the author & book",
      "url": "https://www.libristo.eu/en/book/how-to-fail-at-almost-everything-and-still-win-big-kind-of-the-story-of-my-life_44117165"
    },
    "praise": []
  },
  "the-book-of-elon": {
    "summary": [
      "A collection of Elon Musk’s ideas on work, invention and ambitious projects, curated by Eric Jorgenson.",
      "The chapters collect ideas about learning, engineering, work and projects pursued over long periods. The format lets individual observations build into a broader account of ambition and problem-solving. Jorgenson’s role is that of a curator, bringing scattered public material into one readable sequence."
    ],
    "biography": "Eric Jorgenson curates ideas from entrepreneurs and thinkers into books. He is the author of The Almanack of Naval Ravikant and The Anthology of Balaji. For The Book of Elon, he assembled material from public interviews and appearances, with a foreword by Naval Ravikant and visuals by Jack Butcher.",
    "authorLink": {
      "label": "About the author & book",
      "url": "https://www.elonmuskbook.org/"
    },
    "praise": [],
    "resources": [
      {
        "title": "The book’s companion website",
        "description": "Explore the chapter list and background to the collection.",
        "link": {
          "label": "Explore",
          "url": "https://www.elonmuskbook.org/"
        }
      }
    ]
  },
  "naval": {
    "summary": [
      "Naval Ravikant’s reflections on wealth, judgement and happiness, gathered into a guide for thinking independently.",
      "The first part considers how judgement, specific knowledge and ownership can contribute to wealth. The second turns to happiness, desire, health and the quality of attention. The book is arranged for browsing as well as continuous reading, with ideas that can be revisited independently."
    ],
    "biography": "Eric Jorgenson is the writer and curator behind The Almanack of Naval Ravikant. The book gathers Naval’s public reflections into a connected account of wealth and happiness. It includes a foreword by Tim Ferriss and is accompanied by an official website where readers can explore the ideas and reading recommendations.",
    "authorLink": {
      "label": "About the author & book",
      "url": "https://www.simonandschuster.com/books/The-Almanack-of-Naval-Ravikant/Eric-Jorgenson/9798893310948"
    },
    "praise": [],
    "resources": [
      {
        "title": "Read and revisit the Almanack",
        "description": "The official companion site makes the book available to read and explores Naval’s recommended books.",
        "link": {
          "label": "Explore",
          "url": "https://www.navalmanack.com/home"
        }
      }
    ]
  }
};
