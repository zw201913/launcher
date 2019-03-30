package com.github.sandbox.web;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Slf4j
@RequestMapping("/user")
@RestController
public class UserController {

    /**
     * 创建一个空对象，避免找不到缓存抛异常
     */
    private static final User EMPTY = new User();

    /**
     * 构建一个本地缓存
     */
    private static final LoadingCache<Integer, User> CACHE = CacheBuilder.newBuilder()
            //初始化100个
            .initialCapacity(100)
            //最大10000
            .maximumSize(10000)
            //30分钟没有读写操作数据就过期
            .expireAfterAccess(30, TimeUnit.MINUTES)
            .build(new CacheLoader<Integer, User>() {
                //如果get()没有拿到缓存，直接点用load()加载缓存
                @Override
                public User load(Integer key) {
                    log.info("key:" + key);
                    return EMPTY;
                }

                /**
                 * 在调用getAll()的时候，如果没有找到缓存，就会调用loadAll()加载缓存
                 * @param keys
                 * @return
                 * @throws Exception
                 */
                @Override
                public Map<Integer, User> loadAll(Iterable<? extends Integer> keys) throws Exception {
                    log.info(String.valueOf(keys));
                    return super.loadAll(keys);
                }
            });


    @Data
    static class User {
        /**
         * id
         */
        private Integer id;
        /**
         * 名字
         */
        private String name;
        /**
         * 性别
         */
        private Boolean isMan;
        /**
         * 头像名称
         */
        private String imageName;
    }

    /**
     * 获取所有的users
     *
     * @return
     */
    @GetMapping("/list")
    @ResponseBody
    public Collection<User> users() {
        Map<Integer, User> map = CACHE.asMap();
        return map.values();
    }

    /**
     * 添加user(设置头像)
     *
     * @param user
     * @param image
     * @return
     */
    @PostMapping("/addWithImage")
    @ResponseBody
    public User add(@RequestPart("user") User user, @RequestPart("image") MultipartFile image) {
        //拿到头像进行处理
        user.setImageName(image.getName());
        //缓存
        CACHE.put(user.getId(), user);
        return user;
    }

    /**
     * 第一种方式(推荐)
     * 添加user(不设置头像)
     *
     * @param user
     * @return
     */
    @PostMapping("/add")
    @ResponseBody
    public User add(@RequestPart("user") User user) {
        //缓存
        CACHE.put(user.getId(), user);
        return user;
    }

    /**
     * 第二种方式
     * 添加user(不设置头像)
     *
     * @param user
     * @return
     */
    @PostMapping("/v2/add")
    @ResponseBody
    public User add2(@RequestBody User user) {
        //缓存
        CACHE.put(user.getId(), user);
        return user;
    }

    /**
     * 修改user
     *
     * @param user
     * @return
     * @throws ExecutionException
     */
    @PutMapping("/update")
    @ResponseBody
    public User update(@RequestBody User user) throws ExecutionException {
        User u = CACHE.get(user.getId());
        u.setImageName(user.getImageName());
        u.setName(user.getName());
        u.setIsMan(user.getIsMan());
        //缓存
        CACHE.put(u.getId(), u);
        return user;
    }

    /**
     *
     * @param id
     * @return
     * @throws ExecutionException
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public User deleteUser(@PathVariable("id") Integer id) throws ExecutionException {
        User user = CACHE.get(id);
        CACHE.invalidate(id);
        return user;
    }
}