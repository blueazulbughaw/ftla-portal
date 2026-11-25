import Link from "next/link";
import QRCode from "qrcode";
import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import Avatar from "@/components/hub/Avatar";
import Notice, { SetupNotice } from "@/components/hub/Notice";
import { saveProfile } from "../actions";
import { hubContext, displayName } from "@/lib/hub-server";
import { siteOrigin } from "@/lib/site";

export const metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const { user, profile, needsSetup } = await hubContext("/hub/profile");
  const name = displayName(profile, user.email);
  const photo = profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const shareUrl = profile ? `${await siteOrigin()}/c/${profile.share_token}` : "";
  const qr = shareUrl ? await QRCode.toString(shareUrl, { type: "svg", margin: 1, color: { dark: "#16160c", light: "#ffffff" } }) : "";

  const toggles = [
    { key: "share_name", label: "Name", value: name, on: profile?.share_name ?? true },
    { key: "share_photo", label: "Photo", value: "Your profile photo", on: profile?.share_photo ?? true },
    { key: "share_email", label: "Email", value: profile?.contact_email || "Add a contact email", on: profile?.share_email ?? false },
    { key: "share_phone", label: "Phone", value: profile?.phone || "Add a phone number", on: profile?.share_phone ?? false },
    { key: "share_linkedin", label: "LinkedIn", value: profile?.linkedin_url || "Add your LinkedIn", on: profile?.share_linkedin ?? true },
    { key: "share_website", label: "Website", value: profile?.website_url || "Add a website", on: profile?.share_website ?? true },
  ];

  return (
    <>
      <Hero
        kicker="Your profile"
        title="Share what you choose."
        intro="Your contact card is opt-in, field by field. Only the details you switch on appear when someone scans your code."
      />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}
        <Notice ok={ok} error={error} />
        <div className="hub-2col">
          <form action={saveProfile} className="card">
            <div className="card-head">
              <div>
                <h2 className="h3">Attendee details</h2>
                <p className="soft small">Update the information other attendees can use to find you.</p>
              </div>
              <span className="card-ico"><Icon name="user" /></span>
            </div>

            <div className="callout">
              <Avatar name={name} url={photo} size={72} />
              <label className="photo-field">
                <b>Profile photo</b>
                <span className="soft small">Choose a new photo, up to 5 MB. Only shared when your photo switch is on.</span>
                <input type="file" name="photo" accept="image/*" />
              </label>
            </div>

            <div className="form two">
              <label>Display name<input name="display_name" defaultValue={profile?.display_name ?? name} maxLength={80} /></label>
              <label>
                Account email
                <input value={user.email ?? ""} readOnly disabled />
                <span className="soft small hint">Your sign-in address isn&apos;t shared with attendees.</span>
              </label>
              <label>Contact email<input name="contact_email" type="email" defaultValue={profile?.contact_email ?? ""} /></label>
              <label>Phone<input name="phone" type="tel" placeholder="+1 (555) 000-0000" defaultValue={profile?.phone ?? ""} /></label>
              <label>LinkedIn URL<input name="linkedin_url" placeholder="https://linkedin.com/in/you" defaultValue={profile?.linkedin_url ?? ""} /></label>
              <label>Website URL<input name="website_url" placeholder="https://" defaultValue={profile?.website_url ?? ""} /></label>
            </div>

            <hr />
            <h3 className="h3">Meal preference</h3>
            <p className="soft small">Dietary needs saved for event meals. Private to your account and the organizers.</p>
            <p className="small">{profile?.meal_prefs?.length ? profile.meal_prefs.join(", ") : <span className="soft">No meal preferences added yet.</span>}</p>
            <Link className="cta" href="/hub/experience/food">Edit in Food &amp; drinks <Icon name="arrow" size={14} /></Link>

            <hr />
            <h3 className="h3">Sharing controls</h3>
            <p className="soft small">Turn on only the details you want shown on your share card.</p>
            <ul className="toggles">
              {toggles.map((t) => (
                <li key={t.key}>
                  <b>{t.label}</b>
                  <span className="soft small">{t.value}</span>
                  <label className="switch">
                    <input type="checkbox" name={t.key} defaultChecked={t.on} aria-label={`Share ${t.label}`} />
                    <span />
                  </label>
                </li>
              ))}
            </ul>
            <p><button className="btn" disabled={needsSetup}>Save profile</button></p>
          </form>

          <div className="card qr-card">
            <div className="card-head">
              <div>
                <h2 className="h3">Your share QR</h2>
                <p className="soft small">Let someone scan this to see your card and save it.</p>
              </div>
              <span className="card-ico"><Icon name="card" /></span>
            </div>
            {qr ? (
              <>
                <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
                <p className="soft small center">Only the details you&apos;ve switched on will be shown.</p>
                <code className="share-url">{shareUrl}</code>
                <Link className="cta center" href={`/c/${profile!.share_token}`}>Preview share card <Icon name="arrow" size={14} /></Link>
              </>
            ) : (
              <p className="soft">Your QR code appears once the database is set up.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
