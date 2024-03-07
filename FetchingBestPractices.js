# Принципы fetching
1.  Лучший вариант — получать данные на сервере с помощью Server Components.
2.  Получать данные нужно ровно там, где они используются, а не пересылать их 
    между компонентами: React автоматически кэширует fetch-запросы. 
    Также можно использовать отдельную cache-функцию из библиотеки React.
3.  Когда мы запрашиваем данные сразу по нескольким запросам, нужно учитывать, что в React
    есть 2 паттерна работы с fetch: последовательный и параллельный, они уместны в разных случаях.
4.  Для особо важных данных существует третий паттерн — предзагрузка данных. 





# Получение данных на сервере
Почему это важно?
1.  Более быстрый доступ к данным.
2.  Увеличивается безопасность приложения — токены и API в чистом виде не идут на клиент.
3.  Когда получение данных и рендеринг происходят в одном и том же окружении (на сервере), 
    это сокращает обмен данными между клиентом и сервером и в целом ускоряет работу приложения.
4.  Еще один плюс по скорости: fetch-операции выполняются за один цикл вместо
    множества отдельных запросов на клиенте.
5.  Сокращение водопадов между клиентом и сервером.





# Последовательный и параллельный fetching, водопады
Последовательный: запросы зависят друг от друга и поэтому образуют водопад. 

Бывает, что такой шаблон нужен, потому что результаты одного запроса зависит от результата другого. 
Или мы хотим вручную выставить последовательность запросов, чтобы, например, сэкономить ресурсы. 
Однако такое поведение может быть непредсказуемым и наоборот приводить к увеличению времени загрузки.

Параллельный: запросы инициируются одновременно и загружают данные в одно и то же время. 
Это уменьшает водопады между клиентом и сервером и общее время, необходимое для загрузки данных.

# Итого
Если мы не знаем точно, что нам нужно выполнять запросы последовательно,
их лучше выполнять параллельно.



# Пример последовательных fetch-запросов
async function Playlists({ artistID }) {
  // Ждем плейлисты
  const playlists = await getArtistPlaylists(artistID)

  return (
    <ul>
      {playlists.map((playlist) => (
        <li key={playlist.id}>{playlist.name}</li>
      ))}
    </ul>
  )
}

export default async function ArtistPage({ params: { username } }) {
  // Ждем исполнителя
  const artist = await getArtist(username)

  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Playlists artistID={artist.id} />
      </Suspense>
    </>
  )
}



# Пример параллельных fetch-запросов
async function getArtist(username) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json()
}

async function getArtistAlbums(username) {
  const res = await fetch(`https://api.example.com/artist/${username}/albums`)
  return res.json()
}

export default async function ArtistPage({ params: { username } }) {
  // Создаем параллельно 2 запроса
  const artistData = getArtist(username)
  const albumsData = getArtistAlbums(username)

  // Ждем возвращения обоих промисов
  const [artist, albums] = await Promise.all([artistData, albumsData])

  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums}></Albums>
    </>
  )
}





# Предварительная загрузка данных
Еще один способ предотвратить водопады - использовать третий паттерн, предзагрузку (preload). 
При таком подходе не нужно передавать промисы в качестве пропсов. 
Необязательно называть функцию предагрузки именно preload,
она может иметь любое имя, поскольку это паттерн, а не API.



# Пример

## components/Item.js
import { getItem } from '@/utils/get-item'

export const preload = (id) => void getItem(id)

export default async function Item({ id }) {
  const result = await getItem(id)
  // ...
}

## app/item/[id]/page.js
import Item, { preload, checkIsAvailable } from '@/components/Item'

export default async function Page({ params: { id } }) {
  // Начинаем предзагрузку данных
  preload(id)
  // Запускаем другую асинхронную задачу
  const isAvailable = await checkIsAvailable()

  return isAvailable ? <Item id={id} /> : null
}
