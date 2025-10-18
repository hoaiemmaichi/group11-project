const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createMailTransporter() {
  // Prefer explicit SMTP configs if provided
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpSecure = typeof process.env.SMTP_SECURE !== 'undefined'
    ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: Boolean(smtpSecure),
      auth: { user: smtpUser, pass: smtpPass }
    });
    try {
      await transporter.verify();
      return { transporter, from: smtpUser, mode: 'smtp' };
    } catch (err) {
      console.error('[email] SMTP verify failed:', err);
      // continue to try other methods
    }
  }

  // Fallback to Gmail App Password if available (normalize spaces in app password)
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASSWORD_RAW = process.env.EMAIL_PASSWORD;
  const EMAIL_PASSWORD = EMAIL_PASSWORD_RAW ? EMAIL_PASSWORD_RAW.replace(/\s+/g, '') : undefined;
  const EMAIL_DEBUG = String(process.env.EMAIL_DEBUG || '').toLowerCase() === 'true';
  if (EMAIL_USER && EMAIL_PASSWORD) {
    // Try service=gmail first
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
        logger: EMAIL_DEBUG,
        debug: EMAIL_DEBUG
      });
      await transporter.verify();
      return { transporter, from: EMAIL_USER, mode: 'gmail-service' };
    } catch (err) {
      console.error('[email] Gmail(service) verify failed:', err?.message || err);
    }
    // Try smtp.gmail.com:465 (secure)
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
        tls: { minVersion: 'TLSv1.2' },
        logger: EMAIL_DEBUG,
        debug: EMAIL_DEBUG
      });
      await transporter.verify();
      return { transporter, from: EMAIL_USER, mode: 'gmail-smtp-465' };
    } catch (err) {
      console.error('[email] Gmail(smtp:465) verify failed:', err?.message || err);
    }
    // Try smtp.gmail.com:587 (STARTTLS)
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
        requireTLS: true,
        tls: { minVersion: 'TLSv1.2' },
        logger: EMAIL_DEBUG,
        debug: EMAIL_DEBUG
      });
      await transporter.verify();
      return { transporter, from: EMAIL_USER, mode: 'gmail-smtp-587' };
    } catch (err) {
      console.error('[email] Gmail(smtp:587) verify failed:', err?.message || err);
    }
  }

  // Dev fallback: Ethereal (only for testing; not for production)
  const allowEthereal = String(process.env.ALLOW_ETHEREAL || 'true').toLowerCase() !== 'false';
  if (allowEthereal) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      await transporter.verify();
      console.warn('[email] Using Ethereal test SMTP. Emails are not delivered to real inboxes.');
      return { transporter, from: testAccount.user, mode: 'ethereal' };
    } catch (err) {
      console.error('[email] Ethereal setup failed:', err);
      return { transporter: null, from: null, mode: 'none' };
    }
  }
  return { transporter: null, from: null, mode: 'none' };
}

// GET /auth/mail-status — quick diagnostics to see which email mode is active
exports.mailStatus = async (req, res) => {
  try {
    const has = (k) => Boolean(process.env[k] && String(process.env[k]).trim());
    const snapshot = {
      hasEnv: {
        SMTP_HOST: has('SMTP_HOST'),
        SMTP_PORT: has('SMTP_PORT'),
        SMTP_SECURE: has('SMTP_SECURE'),
        SMTP_USER: has('SMTP_USER'),
        SMTP_PASS: has('SMTP_PASS'),
        EMAIL_USER: has('EMAIL_USER'),
        EMAIL_PASSWORD: has('EMAIL_PASSWORD'),
      }
    };
    const { transporter, from, mode } = await createMailTransporter();
    const ok = Boolean(transporter);
    return res.json({ ok, mode, from: from ? '[configured]' : null, ...snapshot });
  } catch (err) {
    console.error('[mailStatus] error:', err);
    return res.status(500).json({ ok: false, message: 'Mail diagnostics error' });
  }
};

// POST /auth/forgot-password { email }
exports.forgotPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Dịch vụ chưa sẵn sàng, thử lại sau.' });
    }
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Thiếu email' });
    const user = await User.findOne({ email });
    if (!user) {
      // Không tiết lộ tồn tại hay không, trả về OK để tránh dò email
      return res.json({ message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại.' });
    }
    // Tạo token ngẫu nhiên và lưu hash + expiry
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 phút
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expires;
    await user.save();

    // Gửi email chứa token (hoặc link) — hỗ trợ SMTP/Gmail; fallback Ethereal dev
    try {
      const { transporter, from, mode } = await createMailTransporter();
      if (!transporter) {
        console.error('[forgotPassword] No email transporter available. Please configure SMTP or Gmail env vars.');
      } else {
        const appBase = process.env.APP_BASE_URL || 'http://localhost:3001';
        const resetLink = `${appBase}/reset?token=${rawToken}`;
        const info = await transporter.sendMail({
          from: from || 'no-reply@example.com',
          to: email,
          subject: 'Đặt lại mật khẩu',
          text: `Mã đặt lại: ${rawToken}\nLink nhanh: ${resetLink}\nHết hạn lúc: ${expires.toLocaleString()}`,
          html: `<p>Mã đặt lại: <b>${rawToken}</b></p><p>Link nhanh: <a href="${resetLink}">${resetLink}</a></p><p>Hết hạn: ${expires.toLocaleString()}</p>`
        });
        console.log(`[email] sent via mode=${mode} messageId=${info?.messageId}`);
        if (mode === 'ethereal') {
          const preview = nodemailer.getTestMessageUrl(info);
          if (preview) {
            console.warn(`[email] Ethereal preview URL: ${preview}`);
          }
        }
      }
    } catch (mailErr) {
      console.error('[forgotPassword] send mail error:', mailErr);
    }

  // Không trả token về response để đảm bảo an toàn; chỉ thông báo chung
  return res.json({ message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
  } catch (err) {
    console.error('[forgotPassword] error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// POST /auth/reset-password { token, newPassword, confirmNewPassword }
exports.resetPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Dịch vụ chưa sẵn sàng, thử lại sau.' });
    }
    const { token, newPassword, confirmNewPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ message: 'Thiếu token hoặc mật khẩu mới' });
    if (confirmNewPassword && newPassword !== confirmNewPassword) return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
    const tokenHash = hashToken(token);
    const now = new Date();
    const user = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { $gt: now } }).select('+password');
    if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Đổi mật khẩu thành công, hãy đăng nhập lại.' });
  } catch (err) {
    console.error('[resetPassword] error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
