// 부품 카테고리 이미지. public/img/*.jpg 는 scripts/render 의 3D 모델을 렌더링해 만든 것이며,
// 실제 납품 시에는 카페24 상품 사진으로 대체된다.
import { catName, type CatId } from '../data/parts';

export function PartArt({ cat }: { cat: CatId }) {
  return (
    <img
      className="part-art"
      src={`${import.meta.env.BASE_URL}img/${cat}.jpg`}
      alt={`${catName(cat)} 이미지`}
      width={800}
      height={600}
      loading="lazy"
      decoding="async"
    />
  );
}
