import { BookReader } from '@/components/reader/BookReader';
import { notFound } from 'next/navigation';
import type { Page } from '@/lib/types';

// Mock pages data until Supabase is connected
const MOCK_BOOK_PAGES: Record<string, { title: string; pages: Page[] }> = {
  'the-red-cat': {
    title: 'The Red Cat',
    pages: [
      { id: '1', book_id: '1', page_number: 1, image_url: '', english_text: 'This is a red cat. The cat is very happy.', vietnamese_text: 'Đây là một con mèo đỏ. Con mèo rất vui.', audio_en_url: null, audio_vi_url: null },
      { id: '2', book_id: '1', page_number: 2, image_url: '', english_text: 'The cat sees a fish. The fish is blue.', vietnamese_text: 'Con mèo nhìn thấy một con cá. Con cá màu xanh.', audio_en_url: null, audio_vi_url: null },
      { id: '3', book_id: '1', page_number: 3, image_url: '', english_text: 'The cat runs fast! It wants the fish.', vietnamese_text: 'Con mèo chạy nhanh! Nó muốn bắt con cá.', audio_en_url: null, audio_vi_url: null },
      { id: '4', book_id: '1', page_number: 4, image_url: '', english_text: 'The cat and fish are friends now. The end!', vietnamese_text: 'Con mèo và con cá là bạn rồi. Hết!', audio_en_url: null, audio_vi_url: null },
    ],
  },
  'my-family': {
    title: 'My Family',
    pages: [
      { id: '5', book_id: '2', page_number: 1, image_url: '', english_text: 'This is my father. He is tall and kind.', vietnamese_text: 'Đây là bố tôi. Bố cao và tốt bụng.', audio_en_url: null, audio_vi_url: null },
      { id: '6', book_id: '2', page_number: 2, image_url: '', english_text: 'This is my mother. She loves to cook.', vietnamese_text: 'Đây là mẹ tôi. Mẹ thích nấu ăn.', audio_en_url: null, audio_vi_url: null },
      { id: '7', book_id: '2', page_number: 3, image_url: '', english_text: 'This is my brother. He plays with me.', vietnamese_text: 'Đây là anh trai tôi. Anh ấy chơi với tôi.', audio_en_url: null, audio_vi_url: null },
      { id: '8', book_id: '2', page_number: 4, image_url: '', english_text: 'We are a happy family! I love them all.', vietnamese_text: 'Chúng tôi là một gia đình hạnh phúc! Tôi yêu mọi người.', audio_en_url: null, audio_vi_url: null },
    ],
  },
  'colors-everywhere': {
    title: 'Colors Everywhere',
    pages: [
      { id: '9', book_id: '3', page_number: 1, image_url: '', english_text: 'Red! The apple is red. Red is beautiful.', vietnamese_text: 'Đỏ! Quả táo màu đỏ. Màu đỏ rất đẹp.', audio_en_url: null, audio_vi_url: null },
      { id: '10', book_id: '3', page_number: 2, image_url: '', english_text: 'Green! The tree is green. I like green.', vietnamese_text: 'Xanh lá! Cái cây màu xanh. Tôi thích màu xanh lá.', audio_en_url: null, audio_vi_url: null },
      { id: '11', book_id: '3', page_number: 3, image_url: '', english_text: 'Blue! The sky is blue. So big and blue!', vietnamese_text: 'Xanh dương! Bầu trời màu xanh. Rất lớn và xanh!', audio_en_url: null, audio_vi_url: null },
      { id: '12', book_id: '3', page_number: 4, image_url: '', english_text: 'A rainbow! It has all the colors. How wonderful!', vietnamese_text: 'Một cầu vồng! Nó có tất cả các màu. Tuyệt vời làm!', audio_en_url: null, audio_vi_url: null },
    ],
  },
  'at-the-zoo': {
    title: 'At the Zoo',
    pages: [
      { id: '13', book_id: '4', page_number: 1, image_url: '', english_text: 'The lion is the king of animals. It has a big mane.', vietnamese_text: 'Sư tử là vua của các loài thú. Nó có bờm lớn.', audio_en_url: null, audio_vi_url: null },
      { id: '14', book_id: '4', page_number: 2, image_url: '', english_text: 'The elephant is very big. It has a long trunk.', vietnamese_text: 'Con voi rất to. Nó có cái vòi dài.', audio_en_url: null, audio_vi_url: null },
      { id: '15', book_id: '4', page_number: 3, image_url: '', english_text: 'The monkey is funny! It jumps from tree to tree.', vietnamese_text: 'Con khỉ rất vui nhộn! Nó nhảy từ cây này sang cây kia.', audio_en_url: null, audio_vi_url: null },
      { id: '16', book_id: '4', page_number: 4, image_url: '', english_text: 'The giraffe has a very long neck. It eats leaves from tall trees.', vietnamese_text: 'Hươu cao cổ có cổ rất dài. Nó ăn lá từ những cây cao.', audio_en_url: null, audio_vi_url: null },
      { id: '17', book_id: '4', page_number: 5, image_url: '', english_text: 'The penguin cannot fly, but it swims very well!', vietnamese_text: 'Chim cánh cụt không bay được, nhưng nó bơi rất giỏi!', audio_en_url: null, audio_vi_url: null },
    ],
  },
  'counting-to-ten': {
    title: 'Counting to Ten',
    pages: [
      { id: '18', book_id: '5', page_number: 1, image_url: '', english_text: 'One. There is one bright sun in the sky.', vietnamese_text: 'Một. Có một mặt trời sáng trên bầu trời.', audio_en_url: null, audio_vi_url: null },
      { id: '19', book_id: '5', page_number: 2, image_url: '', english_text: 'Two. I see two birds flying together.', vietnamese_text: 'Hai. Tôi thấy hai con chim bay cùng nhau.', audio_en_url: null, audio_vi_url: null },
      { id: '20', book_id: '5', page_number: 3, image_url: '', english_text: 'Three. Three pretty flowers in the garden.', vietnamese_text: 'Ba. Ba bông hoa đẹp trong vườn.', audio_en_url: null, audio_vi_url: null },
      { id: '21', book_id: '5', page_number: 4, image_url: '', english_text: 'Can you count to ten? One, two, three... ten! You did it!', vietnamese_text: 'Bạn đếm được đến mười không? Một, hai, ba... mười! Bạn làm được rồi!', audio_en_url: null, audio_vi_url: null },
    ],
  },
  'the-water-cycle': {
    title: 'The Water Cycle',
    pages: [
      { id: '22', book_id: '6', page_number: 1, image_url: '', english_text: 'The sun heats the water in the ocean. The water gets warm.', vietnamese_text: 'Mặt trời làm nóng nước ở đại dương. Nước trở nên ấm.', audio_en_url: null, audio_vi_url: null },
      { id: '23', book_id: '6', page_number: 2, image_url: '', english_text: 'The warm water rises up and becomes clouds. This is called evaporation.', vietnamese_text: 'Nước ấm bốc lên và trở thành mây. Đây gọi là sự bay hơi.', audio_en_url: null, audio_vi_url: null },
      { id: '24', book_id: '6', page_number: 3, image_url: '', english_text: 'The clouds get heavy with water. Then rain falls down. This is precipitation.', vietnamese_text: 'Các đám mây nặng nước. Sau đó mưa rơi xuống. Đây là sự ngưng tụ.', audio_en_url: null, audio_vi_url: null },
      { id: '25', book_id: '6', page_number: 4, image_url: '', english_text: 'The rain flows into rivers and back to the ocean. Then it starts again!', vietnamese_text: 'Mưa chảy vào sông và trở lại đại dương. Rồi nó bắt đầu lại!', audio_en_url: null, audio_vi_url: null },
    ],
  },
};

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const bookData = MOCK_BOOK_PAGES[slug];

  if (!bookData) notFound();

  return <BookReader bookTitle={bookData.title} pages={bookData.pages} />;
}
