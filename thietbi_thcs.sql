--
-- PostgreSQL database dump
--

\restrict dYR0GExJOzXZmWtwLXbNafqFCfRjuC7oc6qywSg6OpAbPyS2mdE6TBr22QdOjhz

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-05-25 00:50:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 16512)
-- Name: chi_tiet_phieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chi_tiet_phieu (
    id integer NOT NULL,
    maphieu character varying(20),
    maloaitb character varying(20),
    soluongdk integer NOT NULL,
    soluongtra integer,
    soluonghong integer DEFAULT 0,
    soluongmat integer DEFAULT 0,
    ghichutra text
);


ALTER TABLE public.chi_tiet_phieu OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16511)
-- Name: chi_tiet_phieu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chi_tiet_phieu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chi_tiet_phieu_id_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 231
-- Name: chi_tiet_phieu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chi_tiet_phieu_id_seq OWNED BY public.chi_tiet_phieu.id;


--
-- TOC entry 242 (class 1259 OID 16748)
-- Name: email_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_log (
    id integer NOT NULL,
    magv character varying(50),
    email character varying(255),
    tuanso integer,
    namhoc character varying(50),
    loai character varying(32) DEFAULT 'remind_week'::character varying,
    trangthai character varying(20),
    thongbao text,
    ngaygui timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_log OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16747)
-- Name: email_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_log_id_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 241
-- Name: email_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_log_id_seq OWNED BY public.email_log.id;


--
-- TOC entry 221 (class 1259 OID 16455)
-- Name: giao_vien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.giao_vien (
    magv character varying(20) NOT NULL,
    tengv character varying(100) NOT NULL,
    bomon character varying(20),
    taikhoan character varying(50),
    matkhau character varying(100),
    email character varying(255)
);


ALTER TABLE public.giao_vien OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16485)
-- Name: goi_y_thiet_bi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_y_thiet_bi (
    id integer NOT NULL,
    mappct integer,
    maloaitb character varying(20),
    soluongdexuat integer DEFAULT 1
);


ALTER TABLE public.goi_y_thiet_bi OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16484)
-- Name: goi_y_thiet_bi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goi_y_thiet_bi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goi_y_thiet_bi_id_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 226
-- Name: goi_y_thiet_bi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goi_y_thiet_bi_id_seq OWNED BY public.goi_y_thiet_bi.id;


--
-- TOC entry 236 (class 1259 OID 16641)
-- Name: ke_hoach_day_hoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ke_hoach_day_hoc (
    id integer NOT NULL,
    magv character varying(255),
    mamon character varying(255),
    malop character varying(255),
    tuan integer,
    chuong character varying(255),
    tietppct integer,
    tenbaihoc character varying(255),
    thietbi text,
    diadiem character varying(255),
    mappct integer,
    dieuchinh text
);


ALTER TABLE public.ke_hoach_day_hoc OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16640)
-- Name: ke_hoach_day_hoc_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ke_hoach_day_hoc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ke_hoach_day_hoc_id_seq OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 235
-- Name: ke_hoach_day_hoc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ke_hoach_day_hoc_id_seq OWNED BY public.ke_hoach_day_hoc.id;


--
-- TOC entry 240 (class 1259 OID 16719)
-- Name: lich_su_hao_mon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_su_hao_mon (
    id integer NOT NULL,
    maloaitb character varying(50) NOT NULL,
    maphieu character varying(50),
    loaisukien character varying(20) NOT NULL,
    soluong integer NOT NULL,
    nguoithuchien character varying(50),
    ghichu text,
    ngaytao timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lich_su_hao_mon OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16718)
-- Name: lich_su_hao_mon_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lich_su_hao_mon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lich_su_hao_mon_id_seq OWNER TO postgres;

--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 239
-- Name: lich_su_hao_mon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lich_su_hao_mon_id_seq OWNED BY public.lich_su_hao_mon.id;


--
-- TOC entry 223 (class 1259 OID 16468)
-- Name: loai_thiet_bi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loai_thiet_bi (
    maloaitb character varying(20) NOT NULL,
    tenloai character varying(100),
    donvitinh character varying(20),
    tongtonkho integer DEFAULT 0,
    hinhanh character varying(255),
    soluongtot integer DEFAULT 0,
    soluonghong integer DEFAULT 0,
    soluongmat integer DEFAULT 0,
    maqr character varying(80),
    vitrikho character varying(120)
);


ALTER TABLE public.loai_thiet_bi OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16449)
-- Name: lop_hoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lop_hoc (
    malop character varying(20) NOT NULL,
    phongcn character varying(50)
);


ALTER TABLE public.lop_hoc OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16442)
-- Name: mon_hoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mon_hoc (
    mamon character varying(20) NOT NULL,
    tenmon character varying(100) NOT NULL
);


ALTER TABLE public.mon_hoc OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16662)
-- Name: nam_hoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nam_hoc (
    namhoc character varying(20) NOT NULL,
    ngaybatdau date NOT NULL,
    ngayketthuc date NOT NULL,
    isactive boolean DEFAULT false
);


ALTER TABLE public.nam_hoc OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16476)
-- Name: phan_phoi_chuong_trinh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phan_phoi_chuong_trinh (
    mappct integer NOT NULL,
    mamon character varying(20),
    tietthu integer NOT NULL,
    tenbaihoc character varying(200),
    loaiphongyeucau character varying(50)
);


ALTER TABLE public.phan_phoi_chuong_trinh OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16475)
-- Name: phan_phoi_chuong_trinh_mappct_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phan_phoi_chuong_trinh_mappct_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phan_phoi_chuong_trinh_mappct_seq OWNER TO postgres;

--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 224
-- Name: phan_phoi_chuong_trinh_mappct_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phan_phoi_chuong_trinh_mappct_seq OWNED BY public.phan_phoi_chuong_trinh.mappct;


--
-- TOC entry 230 (class 1259 OID 16503)
-- Name: phieu_muon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_muon (
    maphieu character varying(20) NOT NULL,
    matkb integer,
    maphong character varying(20),
    nguoimuon character varying(20),
    ngaytao timestamp without time zone DEFAULT now(),
    trangthai character varying(50) DEFAULT 'ChoDuyet'::character varying,
    lydotuchoi character varying(200),
    maphieutuan character varying(50),
    tinhtrangphieu character varying(20) DEFAULT 'BinhThuong'::character varying,
    ngaytra timestamp without time zone,
    ghichutra text,
    tenbaihoc text,
    ghichudieuchinh text,
    CONSTRAINT chk_phieu_tinhtrang CHECK (((tinhtrangphieu)::text = ANY ((ARRAY['BinhThuong'::character varying, 'HongMotPhan'::character varying, 'MatMotPhan'::character varying, 'HongVaMat'::character varying])::text[])))
);


ALTER TABLE public.phieu_muon OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16671)
-- Name: phieu_tuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phieu_tuan (
    maphieutuan character varying(50) NOT NULL,
    magv character varying(50) NOT NULL,
    namhoc character varying(20) NOT NULL,
    tuanso integer NOT NULL,
    thangso integer NOT NULL,
    ngaybatdautuan date NOT NULL,
    ngayketthuctuan date NOT NULL,
    danhsachmon text,
    trangthai character varying(30) DEFAULT 'ChoDuyet'::character varying,
    lydotuchoi text,
    nguoiduyet character varying(50),
    ngaytao timestamp without time zone DEFAULT now(),
    ngayduyet timestamp without time zone,
    ngaychuanbi timestamp without time zone,
    nguoichuanbi character varying(50)
);


ALTER TABLE public.phieu_tuan OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16462)
-- Name: phong_hoc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong_hoc (
    maphong character varying(20) NOT NULL,
    tenphong character varying(100),
    loaiphong character varying(50),
    tinhtrang character varying(50)
);


ALTER TABLE public.phong_hoc OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16494)
-- Name: thoi_khoa_bieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thoi_khoa_bieu (
    matkb integer NOT NULL,
    magv character varying(20),
    malop character varying(20),
    mamon character varying(20),
    mappct integer,
    ngayhoc date NOT NULL,
    tiethoc integer NOT NULL
);


ALTER TABLE public.thoi_khoa_bieu OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16493)
-- Name: thoi_khoa_bieu_matkb_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.thoi_khoa_bieu_matkb_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.thoi_khoa_bieu_matkb_seq OWNER TO postgres;

--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 228
-- Name: thoi_khoa_bieu_matkb_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.thoi_khoa_bieu_matkb_seq OWNED BY public.thoi_khoa_bieu.matkb;


--
-- TOC entry 234 (class 1259 OID 16610)
-- Name: tkb_tuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tkb_tuan (
    id integer NOT NULL,
    thu integer NOT NULL,
    tiethoc integer NOT NULL,
    malop character varying(50) NOT NULL,
    mamon character varying(50) NOT NULL,
    magv character varying(50) NOT NULL
);


ALTER TABLE public.tkb_tuan OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16609)
-- Name: tkb_tuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tkb_tuan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tkb_tuan_id_seq OWNER TO postgres;

--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 233
-- Name: tkb_tuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tkb_tuan_id_seq OWNED BY public.tkb_tuan.id;


--
-- TOC entry 4934 (class 2604 OID 16515)
-- Name: chi_tiet_phieu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_phieu ALTER COLUMN id SET DEFAULT nextval('public.chi_tiet_phieu_id_seq'::regclass);


--
-- TOC entry 4944 (class 2604 OID 16751)
-- Name: email_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_log ALTER COLUMN id SET DEFAULT nextval('public.email_log_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 16488)
-- Name: goi_y_thiet_bi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_y_thiet_bi ALTER COLUMN id SET DEFAULT nextval('public.goi_y_thiet_bi_id_seq'::regclass);


--
-- TOC entry 4938 (class 2604 OID 16644)
-- Name: ke_hoach_day_hoc id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ke_hoach_day_hoc ALTER COLUMN id SET DEFAULT nextval('public.ke_hoach_day_hoc_id_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 16722)
-- Name: lich_su_hao_mon id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_hao_mon ALTER COLUMN id SET DEFAULT nextval('public.lich_su_hao_mon_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 16479)
-- Name: phan_phoi_chuong_trinh mappct; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phan_phoi_chuong_trinh ALTER COLUMN mappct SET DEFAULT nextval('public.phan_phoi_chuong_trinh_mappct_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 16497)
-- Name: thoi_khoa_bieu matkb; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu ALTER COLUMN matkb SET DEFAULT nextval('public.thoi_khoa_bieu_matkb_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 16613)
-- Name: tkb_tuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tkb_tuan ALTER COLUMN id SET DEFAULT nextval('public.tkb_tuan_id_seq'::regclass);


--
-- TOC entry 4969 (class 2606 OID 16519)
-- Name: chi_tiet_phieu chi_tiet_phieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_phieu
    ADD CONSTRAINT chi_tiet_phieu_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 16758)
-- Name: email_log email_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_log
    ADD CONSTRAINT email_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 16461)
-- Name: giao_vien giao_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giao_vien
    ADD CONSTRAINT giao_vien_pkey PRIMARY KEY (magv);


--
-- TOC entry 4962 (class 2606 OID 16492)
-- Name: goi_y_thiet_bi goi_y_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_y_thiet_bi
    ADD CONSTRAINT goi_y_thiet_bi_pkey PRIMARY KEY (id);


--
-- TOC entry 4973 (class 2606 OID 16649)
-- Name: ke_hoach_day_hoc ke_hoach_day_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ke_hoach_day_hoc
    ADD CONSTRAINT ke_hoach_day_hoc_pkey PRIMARY KEY (id);


--
-- TOC entry 4982 (class 2606 OID 16731)
-- Name: lich_su_hao_mon lich_su_hao_mon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_hao_mon
    ADD CONSTRAINT lich_su_hao_mon_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 16474)
-- Name: loai_thiet_bi loai_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loai_thiet_bi
    ADD CONSTRAINT loai_thiet_bi_pkey PRIMARY KEY (maloaitb);


--
-- TOC entry 4951 (class 2606 OID 16454)
-- Name: lop_hoc lop_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lop_hoc
    ADD CONSTRAINT lop_hoc_pkey PRIMARY KEY (malop);


--
-- TOC entry 4949 (class 2606 OID 16448)
-- Name: mon_hoc mon_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mon_hoc
    ADD CONSTRAINT mon_hoc_pkey PRIMARY KEY (mamon);


--
-- TOC entry 4975 (class 2606 OID 16670)
-- Name: nam_hoc nam_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nam_hoc
    ADD CONSTRAINT nam_hoc_pkey PRIMARY KEY (namhoc);


--
-- TOC entry 4960 (class 2606 OID 16483)
-- Name: phan_phoi_chuong_trinh phan_phoi_chuong_trinh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phan_phoi_chuong_trinh
    ADD CONSTRAINT phan_phoi_chuong_trinh_pkey PRIMARY KEY (mappct);


--
-- TOC entry 4967 (class 2606 OID 16510)
-- Name: phieu_muon phieu_muon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_muon
    ADD CONSTRAINT phieu_muon_pkey PRIMARY KEY (maphieu);


--
-- TOC entry 4978 (class 2606 OID 16686)
-- Name: phieu_tuan phieu_tuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tuan
    ADD CONSTRAINT phieu_tuan_pkey PRIMARY KEY (maphieutuan);


--
-- TOC entry 4955 (class 2606 OID 16467)
-- Name: phong_hoc phong_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_hoc
    ADD CONSTRAINT phong_hoc_pkey PRIMARY KEY (maphong);


--
-- TOC entry 4964 (class 2606 OID 16502)
-- Name: thoi_khoa_bieu thoi_khoa_bieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu
    ADD CONSTRAINT thoi_khoa_bieu_pkey PRIMARY KEY (matkb);


--
-- TOC entry 4971 (class 2606 OID 16621)
-- Name: tkb_tuan tkb_tuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tkb_tuan
    ADD CONSTRAINT tkb_tuan_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 1259 OID 16742)
-- Name: idx_lichsu_haomon_thietbi; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lichsu_haomon_thietbi ON public.lich_su_hao_mon USING btree (maloaitb, ngaytao DESC);


--
-- TOC entry 4965 (class 1259 OID 16704)
-- Name: idx_phieu_muon_phieu_tuan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_muon_phieu_tuan ON public.phieu_muon USING btree (maphieutuan);


--
-- TOC entry 4976 (class 1259 OID 16698)
-- Name: idx_phieu_tuan_trangthai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phieu_tuan_trangthai ON public.phieu_tuan USING btree (trangthai, ngaytao DESC);


--
-- TOC entry 4958 (class 1259 OID 16710)
-- Name: uniq_loai_thietbi_qr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_loai_thietbi_qr ON public.loai_thiet_bi USING btree (maqr);


--
-- TOC entry 4979 (class 1259 OID 16697)
-- Name: uniq_phieu_tuan_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_phieu_tuan_active ON public.phieu_tuan USING btree (magv, namhoc, tuanso) WHERE ((trangthai)::text = ANY ((ARRAY['ChoDuyet'::character varying, 'DaDuyet'::character varying, 'DaTra'::character varying, 'DaDuyetMotPhan'::character varying])::text[]));


--
-- TOC entry 4997 (class 2606 OID 16580)
-- Name: chi_tiet_phieu fk_ct_loaitb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_phieu
    ADD CONSTRAINT fk_ct_loaitb FOREIGN KEY (maloaitb) REFERENCES public.loai_thiet_bi(maloaitb);


--
-- TOC entry 4998 (class 2606 OID 16575)
-- Name: chi_tiet_phieu fk_ct_phieu; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_tiet_phieu
    ADD CONSTRAINT fk_ct_phieu FOREIGN KEY (maphieu) REFERENCES public.phieu_muon(maphieu);


--
-- TOC entry 4987 (class 2606 OID 16535)
-- Name: goi_y_thiet_bi fk_goiy_loaitb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_y_thiet_bi
    ADD CONSTRAINT fk_goiy_loaitb FOREIGN KEY (maloaitb) REFERENCES public.loai_thiet_bi(maloaitb);


--
-- TOC entry 4988 (class 2606 OID 16530)
-- Name: goi_y_thiet_bi fk_goiy_ppct; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_y_thiet_bi
    ADD CONSTRAINT fk_goiy_ppct FOREIGN KEY (mappct) REFERENCES public.phan_phoi_chuong_trinh(mappct);


--
-- TOC entry 4985 (class 2606 OID 16520)
-- Name: giao_vien fk_gv_mon; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giao_vien
    ADD CONSTRAINT fk_gv_mon FOREIGN KEY (bomon) REFERENCES public.mon_hoc(mamon);


--
-- TOC entry 4993 (class 2606 OID 16570)
-- Name: phieu_muon fk_pm_nguoimuon; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_muon
    ADD CONSTRAINT fk_pm_nguoimuon FOREIGN KEY (nguoimuon) REFERENCES public.giao_vien(magv);


--
-- TOC entry 4994 (class 2606 OID 16565)
-- Name: phieu_muon fk_pm_phong; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_muon
    ADD CONSTRAINT fk_pm_phong FOREIGN KEY (maphong) REFERENCES public.phong_hoc(maphong);


--
-- TOC entry 4995 (class 2606 OID 16560)
-- Name: phieu_muon fk_pm_tkb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_muon
    ADD CONSTRAINT fk_pm_tkb FOREIGN KEY (matkb) REFERENCES public.thoi_khoa_bieu(matkb);


--
-- TOC entry 4986 (class 2606 OID 16525)
-- Name: phan_phoi_chuong_trinh fk_ppct_mon; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phan_phoi_chuong_trinh
    ADD CONSTRAINT fk_ppct_mon FOREIGN KEY (mamon) REFERENCES public.mon_hoc(mamon);


--
-- TOC entry 4989 (class 2606 OID 16540)
-- Name: thoi_khoa_bieu fk_tkb_gv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu
    ADD CONSTRAINT fk_tkb_gv FOREIGN KEY (magv) REFERENCES public.giao_vien(magv);


--
-- TOC entry 4990 (class 2606 OID 16545)
-- Name: thoi_khoa_bieu fk_tkb_lop; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu
    ADD CONSTRAINT fk_tkb_lop FOREIGN KEY (malop) REFERENCES public.lop_hoc(malop);


--
-- TOC entry 4991 (class 2606 OID 16550)
-- Name: thoi_khoa_bieu fk_tkb_mon; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu
    ADD CONSTRAINT fk_tkb_mon FOREIGN KEY (mamon) REFERENCES public.mon_hoc(mamon);


--
-- TOC entry 4992 (class 2606 OID 16555)
-- Name: thoi_khoa_bieu fk_tkb_ppct; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thoi_khoa_bieu
    ADD CONSTRAINT fk_tkb_ppct FOREIGN KEY (mappct) REFERENCES public.phan_phoi_chuong_trinh(mappct);


--
-- TOC entry 5001 (class 2606 OID 16732)
-- Name: lich_su_hao_mon lich_su_hao_mon_maloaitb_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_hao_mon
    ADD CONSTRAINT lich_su_hao_mon_maloaitb_fkey FOREIGN KEY (maloaitb) REFERENCES public.loai_thiet_bi(maloaitb);


--
-- TOC entry 5002 (class 2606 OID 16737)
-- Name: lich_su_hao_mon lich_su_hao_mon_maphieu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_su_hao_mon
    ADD CONSTRAINT lich_su_hao_mon_maphieu_fkey FOREIGN KEY (maphieu) REFERENCES public.phieu_muon(maphieu);


--
-- TOC entry 4996 (class 2606 OID 16699)
-- Name: phieu_muon phieu_muon_maphieutuan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_muon
    ADD CONSTRAINT phieu_muon_maphieutuan_fkey FOREIGN KEY (maphieutuan) REFERENCES public.phieu_tuan(maphieutuan);


--
-- TOC entry 4999 (class 2606 OID 16687)
-- Name: phieu_tuan phieu_tuan_magv_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tuan
    ADD CONSTRAINT phieu_tuan_magv_fkey FOREIGN KEY (magv) REFERENCES public.giao_vien(magv);


--
-- TOC entry 5000 (class 2606 OID 16692)
-- Name: phieu_tuan phieu_tuan_namhoc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phieu_tuan
    ADD CONSTRAINT phieu_tuan_namhoc_fkey FOREIGN KEY (namhoc) REFERENCES public.nam_hoc(namhoc);


-- Completed on 2026-05-25 00:50:31

--
-- PostgreSQL database dump complete
--

\unrestrict dYR0GExJOzXZmWtwLXbNafqFCfRjuC7oc6qywSg6OpAbPyS2mdE6TBr22QdOjhz



ALTER TABLE public.phan_phoi_chuong_trinh ADD COLUMN IF NOT EXISTS tuan character varying(50);

CREATE TABLE IF NOT EXISTS public.tien_do_giang_day (
  id SERIAL PRIMARY KEY,
  malop character varying(50),
  mamon character varying(50),
  tiet_ppct_hien_tai integer,
  ngay_cap_nhat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
