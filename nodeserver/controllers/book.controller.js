import { prisma } from '../db.js';

// Helper to format book object with subscribers
const formatBook = (b, subscribers = []) => ({
  id: b.id,
  slug: b.slug,
  title: b.title,
  subtitle: b.subtitle || '',
  eyebrow: b.eyebrow || '',
  author: b.author || '',
  author_role: b.author_role || 'Co-host · Functional medicine',
  author_image: b.author_image || '',
  approver1_name: b.approver1_name || 'Dr. Bill Sears',
  approver1_role: b.approver1_role || 'Pediatrician · Author · Featured expert',
  approver1_image: b.approver1_image || '',
  approver2_name: b.approver2_name || 'Dr. Murray Clarke',
  approver2_role: b.approver2_role || 'Host · The First Seven Years',
  approver2_image: b.approver2_image || '',
  approved_by: b.approved_by || '',
  description: b.description || '',
  note: b.note || '',
  status: b.status || 'In Production',
  publisher: b.publisher || '',
  published: b.published !== false,
  is_featured: b.is_featured === true,
  order: b.order !== undefined ? Number(b.order) : 0,
  cover_type: b.cover_type || 'concept',
  cover_image: b.cover_image || '',
  preorder_url: b.preorder_url || '',
  topics: Array.isArray(b.topics)
    ? b.topics
    : typeof b.topics === 'string'
    ? JSON.parse(b.topics)
    : [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
  waitlist_subscribers: (subscribers || []).map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name || '',
    date: s.date || s.createdAt,
    book_id: s.book_id,
  })),
});

/**
 * GET /api/book
 * Returns the primary/featured book and the list of all books from MySQL
 */
export const getBook = async (req, res) => {
  try {
    let books = await prisma.book.findMany({
      orderBy: { order: 'asc' },
      include: {
        subscribers: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (books.length === 0) {
      return res.json({
        success: true,
        book: null,
        books: [],
      });
    }

    const primaryBook = books.find((b) => b.is_featured) || books[0];
    const formattedBooks = books.map((b) => formatBook(b, b.subscribers));
    const formattedPrimary = formatBook(primaryBook, primaryBook.subscribers);

    res.json({
      success: true,
      book: formattedPrimary,
      books: formattedBooks,
    });
  } catch (err) {
    console.error('Error in getBook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/book/all
 * Returns all books from MySQL
 */
export const getAllBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { order: 'asc' },
      include: {
        subscribers: {
          orderBy: { date: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      books: books.map((b) => formatBook(b, b.subscribers)),
    });
  } catch (err) {
    console.error('Error in getAllBooks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/book/:id
 * Get a specific book by ID or slug
 */
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        subscribers: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      book: formatBook(book, book.subscribers),
    });
  } catch (err) {
    console.error('Error in getBookById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/book
 * Add a new book to the MySQL database
 */
export const createBook = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      eyebrow,
      author,
      author_role,
      author_image,
      approver1_name,
      approver1_role,
      approver1_image,
      approver2_name,
      approver2_role,
      approver2_image,
      approved_by,
      description,
      note,
      status,
      publisher,
      published,
      is_featured,
      order,
      cover_type,
      cover_image,
      preorder_url,
      topics,
      slug,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Book title is required' });
    }

    const bookId = req.body.id || 'book-' + Date.now();
    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') ||
      'book-' + Date.now();

    // If marked as featured, unset any existing featured books
    if (is_featured) {
      await prisma.book.updateMany({
        where: { is_featured: true },
        data: { is_featured: false },
      });
    }

    const created = await prisma.book.create({
      data: {
        id: bookId,
        slug: generatedSlug,
        title: title.trim(),
        subtitle: subtitle || '',
        eyebrow: eyebrow || '',
        author: author || '',
        author_role: author_role || 'Co-host · Functional medicine',
        author_image: author_image || '',
        approver1_name: approver1_name || 'Dr. Bill Sears',
        approver1_role: approver1_role || 'Pediatrician · Author · Featured expert',
        approver1_image: approver1_image || '',
        approver2_name: approver2_name || 'Dr. Murray Clarke',
        approver2_role: approver2_role || 'Host · The First Seven Years',
        approver2_image: approver2_image || '',
        approved_by: approved_by || '',
        description: description || '',
        note: note || '',
        status: status || 'In Production',
        publisher: publisher || '',
        published: published !== false,
        is_featured: is_featured === true,
        order: order !== undefined ? Number(order) : 0,
        cover_type: cover_type || 'concept',
        cover_image: cover_image || '',
        preorder_url: preorder_url || '',
        topics: Array.isArray(topics) ? topics : [],
      },
      include: {
        subscribers: true,
      },
    });

    res.status(201).json({
      success: true,
      book: formatBook(created, created.subscribers),
      message: 'Book created successfully in MySQL database',
    });
  } catch (err) {
    console.error('Error in createBook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/book/:id or PUT /api/book
 * Edit/Update an existing book in MySQL
 */
export const updateBook = async (req, res) => {
  try {
    let targetId = req.params.id || req.body.id;

    if (!targetId) {
      // Find featured or first book
      const first = await prisma.book.findFirst({
        orderBy: [{ is_featured: 'desc' }, { order: 'asc' }],
      });
      if (first) {
        targetId = first.id;
      } else {
        return res.status(404).json({ success: false, message: 'No book found to update' });
      }
    }

    const {
      title,
      subtitle,
      eyebrow,
      author,
      author_role,
      author_image,
      approver1_name,
      approver1_role,
      approver1_image,
      approver2_name,
      approver2_role,
      approver2_image,
      approved_by,
      description,
      note,
      status,
      publisher,
      published,
      is_featured,
      order,
      cover_type,
      cover_image,
      preorder_url,
      topics,
      slug,
    } = req.body;

    // If marked featured, unset other books' featured flag
    if (is_featured) {
      await prisma.book.updateMany({
        where: { id: { not: targetId }, is_featured: true },
        data: { is_featured: false },
      });
    }

    const updated = await prisma.book.upsert({
      where: { id: targetId },
      update: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle }),
        ...(eyebrow !== undefined && { eyebrow }),
        ...(author !== undefined && { author }),
        ...(author_role !== undefined && { author_role }),
        ...(author_image !== undefined && { author_image }),
        ...(approver1_name !== undefined && { approver1_name }),
        ...(approver1_role !== undefined && { approver1_role }),
        ...(approver1_image !== undefined && { approver1_image }),
        ...(approver2_name !== undefined && { approver2_name }),
        ...(approver2_role !== undefined && { approver2_role }),
        ...(approver2_image !== undefined && { approver2_image }),
        ...(approved_by !== undefined && { approved_by }),
        ...(description !== undefined && { description }),
        ...(note !== undefined && { note }),
        ...(status !== undefined && { status }),
        ...(publisher !== undefined && { publisher }),
        ...(published !== undefined && { published }),
        ...(is_featured !== undefined && { is_featured }),
        ...(order !== undefined && { order: Number(order) }),
        ...(cover_type !== undefined && { cover_type }),
        ...(cover_image !== undefined && { cover_image }),
        ...(preorder_url !== undefined && { preorder_url }),
        ...(topics !== undefined && { topics: Array.isArray(topics) ? topics : [] }),
        ...(slug !== undefined && { slug }),
      },
      create: {
        id: targetId,
        title: title || 'The First Seven Years',
        subtitle: subtitle || '',
        eyebrow: eyebrow || '',
        author: author || '',
        author_role: author_role || 'Co-host · Functional medicine',
        author_image: author_image || '',
        approver1_name: approver1_name || 'Dr. Bill Sears',
        approver1_role: approver1_role || 'Pediatrician · Author · Featured expert',
        approver1_image: approver1_image || '',
        approver2_name: approver2_name || 'Dr. Murray Clarke',
        approver2_role: approver2_role || 'Host · The First Seven Years',
        approver2_image: approver2_image || '',
        approved_by: approved_by || '',
        description: description || '',
        note: note || '',
        status: status || 'In Production',
        publisher: publisher || '',
        published: published !== false,
        is_featured: is_featured === true,
        order: order !== undefined ? Number(order) : 0,
        cover_type: cover_type || 'concept',
        cover_image: cover_image || '',
        preorder_url: preorder_url || '',
        topics: Array.isArray(topics) ? topics : [],
        slug: slug || null,
      },
      include: {
        subscribers: {
          orderBy: { date: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      book: formatBook(updated, updated.subscribers),
      message: 'Book details saved successfully to MySQL database',
    });
  } catch (err) {
    console.error('Error in updateBook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/book/:id
 * Delete a book from MySQL
 */
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.book.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Book deleted successfully from database' });
  } catch (err) {
    console.error('Error in deleteBook:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/book/waitlist
 * Add a subscriber to the MySQL waitlist table
 */
export const addWaitlistSubscriber = async (req, res) => {
  try {
    const { email, book_id, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Determine target book
    let targetBookId = book_id;
    if (!targetBookId) {
      const primary = await prisma.book.findFirst({
        orderBy: [{ is_featured: 'desc' }, { order: 'asc' }],
      });
      targetBookId = primary ? primary.id : null;
    }

    // Check if already subscribed
    const existing = await prisma.bookWaitlist.findFirst({
      where: {
        email: trimmedEmail,
        ...(targetBookId ? { book_id: targetBookId } : {}),
      },
    });

    if (existing) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: "You're already on the waitlist! We'll email you as soon as publication details are announced.",
      });
    }

    const newSubscriber = await prisma.bookWaitlist.create({
      data: {
        id: 'sub-' + Date.now(),
        book_id: targetBookId,
        email: trimmedEmail,
        name: name || null,
        date: new Date(),
      },
    });

    res.json({
      success: true,
      message: "You’re on the list — we’ll email you when publication details are announced.",
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
        name: newSubscriber.name,
        date: newSubscriber.date,
        book_id: newSubscriber.book_id,
      },
    });
  } catch (err) {
    console.error('Error in addWaitlistSubscriber:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/book/waitlist/:id
 * Remove a subscriber from the MySQL waitlist table
 */
export const deleteWaitlistSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bookWaitlist.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Subscriber removed successfully from database' });
  } catch (err) {
    console.error('Error in deleteWaitlistSubscriber:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/book/waitlist
 * Retrieve all waitlist subscribers from MySQL
 */
export const getWaitlistSubscribers = async (req, res) => {
  try {
    const subscribers = await prisma.bookWaitlist.findMany({
      orderBy: { date: 'desc' },
      include: {
        book: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({
      success: true,
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        name: s.name,
        date: s.date,
        book_id: s.book_id,
        book_title: s.book?.title,
      })),
    });
  } catch (err) {
    console.error('Error in getWaitlistSubscribers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
