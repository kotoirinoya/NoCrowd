import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { AvatarIllustration } from '@/components/AvatarIllustration'

const TESTIMONIALS = [
  { name: '経済学部3回生', comment: '席探しでカフェを3軒回る無駄がなくなった😳✨ 本当に助かってます！', bg: '#FFF1F6' },
  { name: '法学部3回生', comment: '電源とWi-Fiが確実にある店だけ選べるのが最高！！', bg: '#F2EEFF' },
  { name: '国際学部2回生', comment: '友達に予約リンクを送って一緒に勉強できた〜🎉', bg: '#EAFBF4' },
  { name: '理工学部3回生', comment: '混雑状況が一目でわかるの、地味にすごい発明だと思う😆', bg: '#FFF8E8' },
]

export function LandingPage() {
  return (
    <div className="page landing">
      <header className="landing__hero">
        <Logo size={72} />
        <p>テスト期間、勉強できるカフェの席をアプリで今すぐ確保。</p>
        <div className="landing__cta">
          <Link className="button button--primary" to="/signup">
            無料で始める
          </Link>
          <Link className="button" to="/login">
            ログイン
          </Link>
        </div>
      </header>

      <section className="landing__features">
        <h2>できること</h2>
        <ul>
          <li>現在地から近い順にカフェの混雑状況を確認</li>
          <li>長時間滞在OKなカフェを地図で確認</li>
          <li>席を今すぐ確保、または人数・時間を指定して予約</li>
          <li>Wi-Fi・電源・禁煙/喫煙情報を写真つきで確認</li>
          <li>お気に入りのカフェを写真とコメントで投稿・シェア</li>
        </ul>
      </section>

      <section className="landing__testimonials">
        <h2>利用者の声</h2>
        <div className="landing__testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="landing__testimonial-card" style={{ background: t.bg }}>
              <AvatarIllustration seed={t.name} size={48} />
              <p>{t.comment}</p>
              <cite>{t.name}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      <footer className="landing__download">
        <Link className="button button--primary" to="/signup">
          今すぐダウンロード（会員登録）
        </Link>
        <p>
          カフェ店舗の方は<Link to="/shop/login">こちら</Link>
        </p>
      </footer>
    </div>
  )
}
