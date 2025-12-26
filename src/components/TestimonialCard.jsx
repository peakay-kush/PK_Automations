import { Star } from 'lucide-react';

export default function TestimonialCard({ testimonial }) {
  const rating = Math.max(0, Math.min(5, Number(testimonial.rating || testimonial.rating === 0 ? testimonial.rating : 5)));
  const role = testimonial.role || testimonial.project || '';
  const comment = testimonial.comment || testimonial.story || '';

  // avatar fallback handling
  let avatarSrc = (testimonial.avatar || '').toString();
  if (!avatarSrc) avatarSrc = '/pk-automations-logo-thumb.png';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-center gap-4 mb-4">
        <picture>
          <source srcSet={avatarSrc} type="image/webp" />
          <img
            src={avatarSrc.replace('.webp', '.png')}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = '/pk-automations-logo-thumb.png'; } }}
          />
        </picture>
        <div>
          <h4 className="font-montserrat font-bold text-primary">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
      
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className={i < rating ? 'fill-accent text-accent' : 'text-gray-300'} />
        ))}
      </div>

      <p className="text-gray-700 italic">"{comment}"</p>
    </div>
  );
}
