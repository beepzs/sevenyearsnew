import { prisma } from '../db.js';

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await prisma.askSubmission.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const convertSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await prisma.askSubmission.findUnique({ where: { id } });
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const slug = `q-${Date.now()}`;
    const newAnswer = await prisma.answer.create({
      data: {
        slug,
        q: sub.question,
        quick: 'Clinical answer in progress by Dr. Murray Clarke.',
        body: ['Draft answer body based on inbound parent question.'],
        topic: sub.topic || 'gut-health',
        also: sub.topics || [sub.topic || 'gut-health'],
        ages: [0, 1, 2, 3, 4, 5, 6, 7],
        expert: 'dr-murray-clarke',
        reviewed_by: 'Dr. Murray Clarke',
        reviewed_at: new Date().toISOString().split('T')[0],
        published: false,
        clinical_status: 'draft',
      },
    });

    const updatedSub = await prisma.askSubmission.update({
      where: { id },
      data: { status: 'Answered' },
    });

    res.json({
      success: true,
      answer: newAnswer,
      submission: updatedSub,
      message: 'Converted submission into new Q&A draft!',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSubmission = async (req, res) => {
  try {
    const { parent_name, email, child_age, topic, question } = req.body;
    if (!question || !email) {
      return res.status(400).json({ success: false, message: 'Question and email are required' });
    }

    const RED_REGEX = /(not breathing|can'?t breathe|unconscious|seizure|blue lips|choking|swallowed|poison|overdose|stiff neck|102|103|104|high fever|newborn fever)/i;
    const isRedFlag = RED_REGEX.test(question);
    const id = `sub-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const submission = await prisma.askSubmission.create({
      data: {
        id,
        parent_name: parent_name || 'Parent',
        email,
        child_age: child_age || null,
        topic: topic || null,
        topics: topic ? [topic] : [],
        question,
        date: today,
        status: isRedFlag ? 'Urgent' : 'New',
        red_flag: isRedFlag,
        notes: isRedFlag ? 'Detected critical medical keyword.' : '',
      },
    });

    // Create an alert for admin CMS
    await prisma.alert.create({
      data: {
        id: `alt-${Date.now()}`,
        type: isRedFlag ? 'urgent' : 'submission',
        title: isRedFlag ? `URGENT: Parent Question from ${parent_name || 'Parent'}` : `New Question from ${parent_name || 'Parent'}`,
        meta: isRedFlag ? 'Critical red flag keyword detected' : (question.slice(0, 50) + '...'),
        time: 'Just now',
        unread: true,
        actionTab: 'submissions',
      },
    });

    res.json({
      success: true,
      submission,
      message: 'Question submitted successfully and saved to database',
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

