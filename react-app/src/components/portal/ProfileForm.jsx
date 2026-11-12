export default function ProfileForm({ profile, onSubmit }) {
	const address = profile.billing_address || {};
	return (
		<section className="portal-card">
			<h2>Profile</h2>
			<form className="portal-form" onSubmit={onSubmit}>
				<label>
					Full name
					<input name="full_name" defaultValue={profile.full_name} required />
				</label>
				<label>
					Phone
					<input name="phone" defaultValue={profile.phone} autoComplete="tel" />
				</label>
				<div className="form-row">
					<label>
						Address
						<input name="line1" defaultValue={address.line1} />
					</label>
					<label>
						Address line 2
						<input name="line2" defaultValue={address.line2} />
					</label>
				</div>
				<div className="form-row">
					<label>
						City
						<input name="city" defaultValue={address.city} />
					</label>
					<label>
						Postal code
						<input name="postal_code" defaultValue={address.postal_code} />
					</label>
				</div>
				<div className="form-row">
					<label>
						Country
						<input name="country" defaultValue={address.country} maxLength="2" placeholder="SE" />
					</label>
					<label>
						Locale
						<select name="locale" defaultValue={profile.locale || 'en'}>
							<option value="en">English</option>
							<option value="sv">Svenska</option>
						</select>
					</label>
				</div>
				<button className="btn btn-primary">Save profile</button>
			</form>
		</section>
	);
}
